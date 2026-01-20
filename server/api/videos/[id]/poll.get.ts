import OpenAI from 'openai';
import { blob } from 'hub:blob';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const { id } = getRouterParams(event);

  const db = useDrizzle();

  const chat = await db.query.videoChats.findFirst({
    where: (chat, { eq, and }) => and(eq(chat.id, id), eq(chat.userId, user.id)),
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

  if (processingMessages.length === 0) {
    return { hasProcessing: false };
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const updates = [];

  for (const message of processingMessages) {
    try {
      console.log('Polling video status for job ID:', message.jobId);

      const result = await openai.videos.retrieve(message.jobId!);

      console.log('Video status for job ID:', message.jobId, 'Status:', result.status);

      if (result.status === 'completed') {
        console.log('Video completed for job ID:', message.jobId, 'Downloading video...');

        const videoResponse = await openai.videos.downloadContent(message.jobId!, {
          variant: 'video',
        });

        const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

        const filename = `videos/${user.id}/${chat.id}/${crypto.randomUUID()}.mp4`;

        await blob.put(filename, videoBuffer, {
          contentType: 'video/mp4',
        });

        console.log('Video downloaded and saved to blob storage:', filename, 'for job ID:', message.jobId);

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
      } else if (result.status === 'failed') {
        console.error('Video generation failed for job ID:', message.jobId, 'Error:', result.error);

        await db
          .update(tables.videoChatMessages)
          .set({
            status: 'failed',
          })
          .where(eq(tables.videoChatMessages.id, message.id));

        updates.push({
          id: message.id,
          status: 'failed',
        });
      }
    } catch (error: any) {
      console.error('Video polling error for job ID:', message.jobId, 'Error:', error);
    }
  }

  return {
    hasProcessing: processingMessages.some((m) => !updates.find((u) => u.id === m.id)),
    updates,
  };
});
