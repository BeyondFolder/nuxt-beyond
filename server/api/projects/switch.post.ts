import { z } from 'zod';
import { getUserProjectRole } from '~~/server/db/queries';

const bodySchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
});

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const db = useDrizzle();

  const { projectId } = await readValidatedBody(event, bodySchema.parse);

  const role = await getUserProjectRole(db, session.user.id, projectId);

  if (!role) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You are not a member of this project',
    });
  }

  await replaceUserSession(event, {
    ...session,
    projectId,
  });

  return setResponseStatus(event, 204); // No Content status code
});
