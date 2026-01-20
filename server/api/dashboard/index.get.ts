import { getUserWithProject } from '~~/server/db/queries';

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const db = useDrizzle();

  const result = await getUserWithProject(db, session.user.email, session?.projectId);

  if (!result || result.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User or project not found',
    });
  }

  const data = result[0]!;

  return {
    currentProject: data.project,
    currentProjectRole: data.role,
  };
});
