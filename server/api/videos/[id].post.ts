import { z } from 'zod';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const { id } = getRouterParams(event);

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Video chat ID is required' });
  }

  const ai = requireGeminiClient();

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

  if (chat.messages.some((m) => m.status === 'processing')) {
    throw createError({ statusCode: 409, statusMessage: 'A video is still generating. Wait for it to finish first.' });
  }

  let previousVideoId =
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
    let interaction;

    try {
      interaction = await startVideoInteraction(ai, {
        prompt: body.prompt,
        previousInteractionId: previousVideoId,
      });
    } catch (error) {
      const status = getGeminiErrorStatus(error);

      if (!previousVideoId || (status !== 400 && status !== 404)) {
        throw error;
      }

      console.warn('Previous video interaction is unavailable, starting a new video instead:', previousVideoId, error);
      previousVideoId = null;
      interaction = await startVideoInteraction(ai, { prompt: body.prompt });

      if (userMessage) {
        await db
          .update(tables.videoChatMessages)
          .set({ previousVideoId: null })
          .where(eq(tables.videoChatMessages.id, userMessage.id));
      }
    }

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
