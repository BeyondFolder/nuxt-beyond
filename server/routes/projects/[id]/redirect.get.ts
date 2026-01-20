import { getUserProjectRole } from '~~/server/db/queries';

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session?.user?.id) {
    return sendRedirect(event, '/login');
  }

  const db = useDrizzle();
  const projectId = getRouterParam(event, 'id');
  const query = getQuery(event);
  const target = query.target as string;

  if (!projectId || !target) {
    return sendRedirect(event, '/dashboard');
  }

  const role = await getUserProjectRole(db, session.user.id, projectId);

  if (!role) {
    return sendRedirect(event, '/dashboard');
  }

  await replaceUserSession(event, {
    ...session,
    projectId,
  });

  return sendRedirect(event, target);
});
