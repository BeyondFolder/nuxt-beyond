export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const projectId = query.projectId as string;

  const db = useDrizzle();
  await validateProject(db, projectId);

  const embedSession = validateEmbedSession(event, projectId);

  const chat = await db.query.chats.findFirst({
    where: (chat, { eq }) =>
      and(
        eq(chat.id, embedSession.chatId as string),
        eq(chat.projectId, embedSession.projectId),
        eq(chat.origin, embedSession.origin)
      ),
    with: {
      messages: true,
    },
  });
  if (!chat) {
    throw createError({ statusCode: 404, statusMessage: 'Chat not found' });
  }

  return chat;
});
