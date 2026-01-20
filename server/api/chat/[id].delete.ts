import { eq, and } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const { id } = getRouterParams(event);

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Chat ID is required' });
  }

  const db = useDrizzle();

  const chat = await db.query.userChats.findFirst({
    where: (chat, { eq, and }) => and(eq(chat.id, id), eq(chat.userId, user.id)),
  });

  if (!chat) {
    throw createError({ statusCode: 404, statusMessage: 'Chat not found' });
  }

  await db.delete(tables.userChats).where(and(eq(tables.userChats.id, id), eq(tables.userChats.userId, user.id)));

  return { success: true };
});
