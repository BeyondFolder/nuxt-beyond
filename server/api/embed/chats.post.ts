import type { EmbedSession } from '#shared/types';
import { PLANS_CONSTANTS } from '#shared/constants';
import { getRepliesThisMonth } from '~~/server/db/queries';
import { z } from 'zod';

const bodySchema = z.object({
  input: z.string().min(1).max(1000),
});

export default defineEventHandler(async (event) => {
  const rateLimit = await checkRateLimit(event, {
    maxRequests: 5,
    windowMs: 10 * 60 * 1000,
    keyPrefix: 'embed-chat-create',
  });

  if (!rateLimit.allowed) {
    const resetDate = new Date(rateLimit.resetAt);
    throw createError({
      statusCode: 429,
      statusMessage: `Too many chat sessions created. Please try again after ${resetDate.toLocaleTimeString()}.`,
    });
  }

  const query = getQuery(event);
  const projectId = query.projectId as string;

  const db = useDrizzle();
  const project = await validateProject(db, projectId);

  const { refererDomain } = validateReferer(event);

  validateDomain(project, refererDomain);

  const planConfig = PLANS_CONSTANTS[project.planName];
  const maxReplies = planConfig?.MAX_NB_OF_AI_REPLIES || 0;

  const repliesThisMonth = await getRepliesThisMonth(db, projectId);

  if (repliesThisMonth >= maxReplies) {
    throw createError({
      statusCode: 429,
      statusMessage: "Chatbot is currently unavailable. Please contact the site owner.",
    });
  }

  const { input } = await readValidatedBody(event, bodySchema.parse);

  const [chat] = await db
    .insert(tables.chats)
    .values({
      title: '',
      projectId: projectId,
      origin: refererDomain,
    })
    .returning();
  if (!chat) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create chat' });
  }

  const config = useRuntimeConfig(event);

  const session = await useSession(event, {
    password: config.session.password,
    maxAge: 5 * 24 * 60 * 60, // 5 days
    name: 'embed_session',
    sessionHeader: 'x-embed-session',
  });

  await session.update({
    chatId: chat.id,
    projectId: projectId,
    origin: refererDomain,
  } as EmbedSession);

  const embedSessionHeader = event.node.res
    .getHeader('set-cookie')!
    .toString()
    .match(/embed_session=(.*?); /)?.[1];

  event.node.res.appendHeader('x-embed-session', embedSessionHeader!);

  await db.insert(tables.messages).values({
    chatId: chat.id,
    role: 'user',
    parts: [{ type: 'text', text: input }],
  });

  const chatId = chat.id;

  return await db.query.chats.findFirst({
    where: (chat, { eq }) => eq(chat.id, chatId),
    with: {
      messages: true,
    },
  });
});
