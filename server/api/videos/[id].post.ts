import { z } from 'zod';
import { eq } from 'drizzle-orm';

// Follow-up prompt in a video chat. It edits the latest finished video through Omni's
// previous_interaction_id, or generates a new video when the chat has none yet.
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const { id } = getRouterParams(event);

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Video chat ID is required' });
  }

  const apiKey = requireGeminiApiKey();

  const body = await readValidatedBody(
    event,
    z.object({
      prompt: z.string().min(1).max(1000),
    }).parse
  );

  const db = useDrizzle();

  const chat = await db.query.videoChats.findFirst({
    where: (chat, { eq, and }) => and(eq(chat.id, id), eq(chat.userId, user.id)),
    with: {
      messages: {
        orderBy: (messages, { asc }) => [asc(messages.createdAt)],
      },
    },
  });

  if (!chat) {
    throw createError({ statusCode: 404, statusMessage: 'Video chat not found' });
  }

  // Omni rejects a turn chained to an interaction that is still running
  if (chat.messages.some((m) => m.status === 'processing')) {
    throw createError({ statusCode: 409, statusMessage: 'A video is still generating. Wait for it to finish first.' });
  }

  // Taken from this chat on the server, so a user can only build on their own videos
  const previousVideoId =
    chat.messages.filter((m) => m.role === 'assistant' && m.status === 'completed' && m.jobId).at(-1)?.jobId ?? null;

  const [userMessage] = await db
    .insert(tables.videoChatMessages)
    .values({
      chatId: chat.id,
      role: 'user',
      prompt: body.prompt,
      previousVideoId,
    })
    .returning();

  try {
    const interaction = await startVideoInteraction(apiKey, {
      prompt: body.prompt,
      previousInteractionId: previousVideoId,
    });

    console.log('Video generation started. Interaction ID:', interaction.id, 'previous:', previousVideoId);

    await db.insert(tables.videoChatMessages).values({
      chatId: chat.id,
      role: 'assistant',
      prompt: body.prompt,
      jobId: interaction.id,
      status: 'processing',
      previousVideoId,
    });

    return {
      role: 'assistant',
      prompt: body.prompt,
      jobId: interaction.id,
      status: 'processing',
      previousVideoId,
    };
  } catch (error) {
    console.error('Video generation error for chat:', chat.id, 'Error:', error);
    if (userMessage) {
      await db.delete(tables.videoChatMessages).where(eq(tables.videoChatMessages.id, userMessage.id));
    }
    throw toVideoHttpError(error);
  }
});
