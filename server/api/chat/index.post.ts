import { z } from 'zod';

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);

  const body = await readValidatedBody(
    event,
    z.object({
      id: z.string().uuid().optional(),
      message: z.object({
        role: z.literal('user'),
        parts: z.array(z.any()),
      }),
    }).parse
  );

  const db = useDrizzle();

  const chatId = body.id || crypto.randomUUID();

  const [chat] = await db
    .insert(tables.userChats)
    .values({
      id: chatId,
      userId: user.id,
      title: '',
    })
    .returning();

  if (!chat) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create chat' });
  }

  await db.insert(tables.userChatMessages).values({
    chatId: chat.id,
    role: 'user',
    parts: body.message.parts,
  });

  return await db.query.userChats.findFirst({
    where: (c, { eq }) => eq(c.id, chat.id),
    with: {
      messages: true,
    },
  });
});
