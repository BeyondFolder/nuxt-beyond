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
      messages: {
        orderBy: (messages, { asc }) => [asc(messages.createdAt)],
      },
    },
  });

  if (!chat) {
    throw createError({ statusCode: 404, statusMessage: 'Video chat not found' });
  }

  return chat;
});
