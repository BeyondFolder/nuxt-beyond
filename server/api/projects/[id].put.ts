import { z } from 'zod';
import { getUserProjectRole } from '~~/server/db/queries';

const bodySchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
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

  const { name, description } = await readValidatedBody(event, bodySchema.parse);

  const role = await getUserProjectRole(db, session.user.id, projectId);
  if (!role) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You do not have access to this project',
    });
  }

  if (role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'You must be an admin to modify project settings',
    });
  }

  // Update the project
  const project = await db
    .update(tables.projects)
    .set({
      name,
      description: description ? sanitizeCustomPrompt(description) : description,
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
    role,
  };
});
