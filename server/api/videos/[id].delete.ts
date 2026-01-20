import { eq, and } from 'drizzle-orm';
import OpenAI from 'openai';

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

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  console.log('Deleting video chat:', id, 'with', chat.messages.length, 'messages');

  for (const message of chat.messages) {
    if (message.jobId) {
      try {
        console.log('Deleting video from OpenAI. Job ID:', message.jobId);
        await openai.videos.delete(message.jobId);
        console.log('Successfully deleted video from OpenAI. Job ID:', message.jobId);
      } catch (error: any) {
        console.error('Failed to delete video from OpenAI. Job ID:', message.jobId, 'Error:', error);
      }
    }
  }

  await db.delete(tables.videoChats).where(and(eq(tables.videoChats.id, id), eq(tables.videoChats.userId, user.id)));

  console.log('Video chat deleted successfully:', id);

  return { success: true };
});
