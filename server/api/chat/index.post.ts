import { z } from 'zod';
import { DEMO_CONFIG } from '#shared/demo';
import { kv } from 'hub:kv'

export default defineEventHandler(async (event) => {
  const today = new Date().toDateString();
  const demoUserChatsKey = `demo:user-chats:${today}`;

  const chatCount = await kv.get<number>(demoUserChatsKey) || 0;

  if (chatCount >= DEMO_CONFIG.maxUserChatsPerDay) {
    throw createError({
      statusCode: 429,
      statusMessage: `Demo chat limit reached (${DEMO_CONFIG.maxUserChatsPerDay} per day). This limit helps us manage demo costs. Clone NuxtBeyond from GitHub to run your own instance.`,
    });
  }

  const { user } = await requireUserSession(event);

  const body = await readValidatedBody(
    event,
    z.object({
      id: z.uuid().optional(),
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

  await kv.set(demoUserChatsKey, chatCount + 1, {
    ttl: 60 * 60 * 24,
  });

  return await db.query.userChats.findFirst({
    where: (c, { eq }) => eq(c.id, chat.id),
    with: {
      messages: true,
    },
  });
});
