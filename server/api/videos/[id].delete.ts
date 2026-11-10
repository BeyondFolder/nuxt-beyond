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

  // Best effort: also delete the interactions Google stores for edits (kept up to 55 days otherwise)
  const apiKey = getGeminiApiKey();

  if (apiKey) {
    for (const message of chat.messages) {
      if (message.role === 'assistant' && message.jobId) {
        try {
          await deleteInteraction(apiKey, message.jobId);
        } catch (error) {
          console.error('Failed to delete Gemini interaction:', message.jobId, 'Error:', error);
        }
      }
    }
  }

  const blobs = await blob.list({ prefix: `videos/${user.id}/${id}/` });

  for (const b of blobs.blobs) {
    await blob.del(b.pathname);
  }

  await db.delete(tables.videoChats).where(and(eq(tables.videoChats.id, id), eq(tables.videoChats.userId, user.id)));

  console.log('Video chat deleted successfully:', id);

  return { success: true };
});
