import { blob } from 'hub:blob';
import { eq } from 'drizzle-orm';

// A job still running after this long is marked failed, so a lost interaction can't leave the chat stuck
const MAX_PROCESSING_MS = 30 * 60 * 1000;

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const { id } = getRouterParams(event);

  const apiKey = requireGeminiApiKey();

  const db = useDrizzle();

  const chat = await db.query.videoChats.findFirst({
    where: (chat, { eq, and }) => and(eq(chat.id, id!), eq(chat.userId, user.id)),
    with: {
      messages: {
        where: (messages, { eq }) => eq(messages.status, 'processing'),
        orderBy: (messages, { asc }) => [asc(messages.createdAt)],
      },
    },
  });

  if (!chat) {
    throw createError({ statusCode: 404, statusMessage: 'Video chat not found' });
  }

  const processingMessages = chat.messages.filter((m) => m.status === 'processing' && m.jobId);

  const updates: { id: string; status: 'completed' | 'failed'; videoUrl?: string; error?: string }[] = [];

  async function markFailed(messageId: string, error: string) {
    console.error('Video generation failed for message:', messageId, 'Error:', error);
    await db.update(tables.videoChatMessages).set({ status: 'failed' }).where(eq(tables.videoChatMessages.id, messageId));
    updates.push({ id: messageId, status: 'failed', error });
  }

  for (const message of processingMessages) {
    const timedOut = Date.now() - message.createdAt.getTime() > MAX_PROCESSING_MS;

    try {
      const interaction = await getInteraction(apiKey, message.jobId!);

      if (interaction.status === 'in_progress') {
        if (timedOut) {
          await markFailed(message.id, 'Video generation timed out');
        }
        continue;
      }

      const video =
        interaction.status === 'completed' || interaction.status === 'incomplete' ? findVideoOutput(interaction) : undefined;

      if (!video) {
        await markFailed(message.id, getInteractionError(interaction));
        continue;
      }

      const videoBytes = await downloadVideo(apiKey, video);

      if (!videoBytes) {
        continue; // URI-delivered file still processing, try again on the next poll
      }

      const filename = `videos/${user.id}/${chat.id}/${crypto.randomUUID()}.mp4`;

      await blob.put(filename, videoBytes, {
        contentType: video.mime_type || 'video/mp4',
      });

      console.log('Video saved to blob storage:', filename, 'for interaction:', message.jobId);

      const videoUrl = `/blob/${filename}`;

      await db
        .update(tables.videoChatMessages)
        .set({
          videoUrl,
          status: 'completed',
        })
        .where(eq(tables.videoChatMessages.id, message.id));

      updates.push({
        id: message.id,
        videoUrl,
        status: 'completed',
      });
    } catch (error) {
      if (error instanceof GeminiApiError && error.status === 404) {
        await markFailed(message.id, 'The video job no longer exists on Google');
      } else if (timedOut) {
        await markFailed(message.id, 'Video generation timed out');
      } else {
        // Network or provider hiccup: keep the job and retry on the next poll
        console.error('Video polling error for interaction:', message.jobId, 'Error:', error);
      }
    }
  }

  return {
    hasProcessing: processingMessages.length > updates.length,
    updates,
  };
});
