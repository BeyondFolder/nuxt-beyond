import { getUserProjectRole, getUserProjects } from '~~/server/db/queries';

export default defineEventHandler(async (event) => {
  // TODO: Add email confirmation when deleting a project
  const session = await requireUserSession(event);
  const db = useDrizzle();

  const projectId = getRouterParam(event, 'id');
  if (!projectId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project ID is required',
    });
  }

  const role = await getUserProjectRole(db, session.user.id, projectId);
  if (!role || role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'You must be an admin to delete this project',
    });
  }

  await db.delete(tables.projects).where(eq(tables.projects.id, projectId));

  const userProjects = await getUserProjects(db, session.user.email);

  // Update session with new project or null
  await replaceUserSession(event, {
    ...session,
    projectId: userProjects[0]?.project.id,
    projectRole: userProjects[0]?.role ?? undefined,
  });

  return setResponseStatus(event, 204); // No Content status code
});
