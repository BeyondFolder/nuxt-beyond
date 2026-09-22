import { z } from 'zod';
import { getUserProjectWithRole } from '~~/server/db/queries';
import type { ProjectConfiguration } from '#shared/types';
import { ALLOWED_LOGO_TYPES, MAX_LOGO_SIZE } from '#shared/constants';
import { blob } from 'hub:blob'

const bodySchema = z.object({
  security: z.object({
    allowedDomains: z.array(z.string()),
  }),
  appearance: z.object({
    primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
    position: z.enum(['bottom-right', 'bottom-left']),
    logo: z.object({
      data: z.string(),
      filename: z.string(),
      contentType: z.string(),
    }).optional().nullable(),
  }),
  chat: z.object({
    initialQuestions: z.array(z.string()).max(3, 'Maximum 3 initial questions allowed').optional(),
    customPrompt: z.string().optional(),
  }).optional(),
});

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const db = useDrizzle();

  const projectId = getRouterParam(event, 'id');
  if (!projectId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project ID is required',
    });
  }

  const { security, appearance, chat } = await readValidatedBody(event, bodySchema.parse);

  const userProject = await getUserProjectWithRole(db, session.user.id, projectId);
  if (!userProject || !userProject.role || userProject.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'You must be an admin to modify project configuration',
    });
  }

  const currentConfig = (userProject.project.configuration as ProjectConfiguration) || {};

  let oldLogoUrl = currentConfig.appearance?.logo;

  if (appearance.logo) {
    const { data, filename, contentType } = appearance.logo;
    const buffer = Buffer.from(data, 'base64');

    if (!ALLOWED_LOGO_TYPES.includes(contentType)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.',
      });
    }

    if (buffer.length > MAX_LOGO_SIZE) {
      throw createError({
        statusCode: 400,
        statusMessage: 'File size exceeds 0.5MB limit.',
      });
    }

    if (oldLogoUrl) {
      try {
        await blob.delete(oldLogoUrl);
      } catch (error) {
        console.error('Failed to delete old logo:', error);
      }
    }

    const extension = filename.split('.').pop() || 'png';
    const blobFilename = `${projectId}-logo-${Date.now()}.${extension}`;

    const blobData = await blob.put(blobFilename, buffer, {
      prefix: 'images/',
      contentType,
      addRandomSuffix: false,
    });

    oldLogoUrl = blobData.pathname;
  } else if (appearance.logo === null && oldLogoUrl) {
    try {
      await blob.delete(oldLogoUrl);
      oldLogoUrl = undefined;
    } catch (error) {
      console.error('Failed to delete logo:', error);
    }
  }

  const updatedConfig: ProjectConfiguration = {
    ...currentConfig,
    security: {
      ...currentConfig.security,
      ...security,
    },
    appearance: {
      ...currentConfig.appearance,
      primaryColor: appearance.primaryColor,
      position: appearance.position,
      logo: oldLogoUrl,
    },
    chat: chat
      ? {
          ...currentConfig.chat,
          ...chat,
          customPrompt: chat.customPrompt ? sanitizeCustomPrompt(chat.customPrompt) : chat.customPrompt,
        }
      : currentConfig.chat,
  };

  const project = await db
    .update(tables.projects)
    .set({
      configuration: updatedConfig,
      updatedAt: new Date(),
    })
    .where(eq(tables.projects.id, projectId))
    .returning()
    .get();

  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Project not found',
    });
  }

  return {
    ...project,
    role: userProject.role,
  };
});
