import type { EmbedSession } from '#shared/types';

export default defineEventHandler(async (event) => {
  const path = event.path;

  if (!path.startsWith('/api/embed/chats/') && (!path.startsWith('/api/embed/chats') || event.method !== 'GET')) {
    return;
  }

  const config = useRuntimeConfig(event);

  const session = await useSession(event, {
    password: config.session.password,
    maxAge: 5 * 24 * 60 * 60, // 5 days
    name: 'embed_session',
    sessionHeader: 'x-embed-session',
  });

  if (!session.data || !(session.data as EmbedSession).origin) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized - No valid session',
    });
  }

  const embedSession = session.data as EmbedSession;

  const referer = getHeader(event, 'referer') || getHeader(event, 'referrer');

  if (!referer) {
    throw createError({
      statusCode: 403,
      statusMessage: 'This project must be embedded on a website',
    });
  }

  const refererUrl = new URL(referer);
  const refererDomain = refererUrl.hostname;

  if (embedSession?.origin !== refererDomain) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized - Invalid referer domain for session',
    });
  }

  event.context.embedSession = session.data;
});
