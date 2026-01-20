import { desc } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);

  const db = useDrizzle();

  const chats = await db.query.userChats.findMany({
    where: (chat, { eq }) => eq(chat.userId, user.id),
    orderBy: [desc(tables.userChats.createdAt)],
    columns: {
      id: true,
      title: true,
      createdAt: true,
    },
  });

  return chats;
});
