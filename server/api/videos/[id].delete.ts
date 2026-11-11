import { eq, and } from 'drizzle-orm';
import { blob } from 'hub:blob';

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const { id } = getRouterParams(event);

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Video chat ID is required' });
  }

  const db = useDrizzle();

  const chat = await db.query.videoChats.findFirst({
    where: (chat, { eq, and }) => and(eq(chat.id, id), eq(chat.userId, user.id)),
    with: {
      messages: true,
    },
  });

  if (!chat) {
    throw createError({ statusCode: 404, statusMessage: 'Video chat not found' });
  }

  console.log('Deleting video chat:', id, 'with', chat.messages.length, 'messages');

  const ai = getGeminiClient();

  if (ai) {
    const jobIds = chat.messages.filter((message) => message.role === 'assistant' && message.jobId).map((message) => message.jobId!);
    const results = await Promise.allSettled(jobIds.map((jobId) => ai.interactions.delete(jobId)));

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error('Failed to delete Gemini interaction:', jobIds[index], 'Error:', result.reason);
      }
    });
  }

  const blobs = await blob.list({ prefix: `videos/${user.id}/${id}/` });

  if (blobs.blobs.length) {
    await blob.del(blobs.blobs.map((b) => b.pathname));
  }

  await db.delete(tables.videoChats).where(and(eq(tables.videoChats.id, id), eq(tables.videoChats.userId, user.id)));

  console.log('Video chat deleted successfully:', id);

  return { success: true };
});
