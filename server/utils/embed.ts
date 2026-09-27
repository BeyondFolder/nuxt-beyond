import type { H3Event } from 'h3';
import { eq } from 'drizzle-orm';
import type { ProjectConfiguration, EmbedSession } from '#shared/types';
import { H3Error } from 'h3';

export async function validateProject(db: ReturnType<typeof useDrizzle>, projectId: string) {
  if (!projectId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project ID is required',
    });
  }

  const project = await db.query.projects.findFirst({
    where: eq(tables.projects.id, projectId),
  });

  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Project not found',
    });
  }

  return project;
}

export function validateReferer(event: H3Event) {
  const referer = getHeader(event, 'referer') || getHeader(event, 'referrer');

  if (!referer) {
    throw createError({
      statusCode: 403,
      statusMessage: 'This project must be embedded on a website',
    });
  }

  const refererUrl = new URL(referer);
  const refererDomain = refererUrl.hostname;

  return { referer, refererDomain };
}

export function validateDomain(project: { configuration: ProjectConfiguration | null }, refererDomain: string) {
  try {
    const config = project.configuration;
    const allowedDomains = config?.security?.allowedDomains || [];

    if (allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some((domain) => {
        const normalizedDomain = domain.toLowerCase().trim();
        const normalizedReferer = refererDomain.toLowerCase();

        return normalizedDomain === normalizedReferer || normalizedReferer.endsWith(`.${normalizedDomain}`);
      });

      if (!isAllowed) {
        const ownSiteDomain = new URL(process.env.NUXT_PUBLIC_SITE_URL!).hostname.toLowerCase();

        // Extra check to allow customization page iframe
        if (refererDomain.toLowerCase() !== ownSiteDomain) {
          throw createError({
            statusCode: 403,
            statusMessage: `Domain ${refererDomain} is not allowed to embed this project`,
          });
        }
      }
    }
  } catch (error) {
    if (error instanceof H3Error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to validate domain',
    });
  }
}

export function validateEmbedSession(event: H3Event, projectId: string, chatId?: string) {
  const embedSession = event.context.embedSession as EmbedSession | undefined;

  if (!embedSession || embedSession.projectId !== projectId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  if (chatId && embedSession.chatId !== chatId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  return embedSession;
}
