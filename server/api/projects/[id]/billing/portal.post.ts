import { getUserProjectWithRole } from '~~/server/db/queries';
import { getPaymentProvider } from '~~/server/utils/billing/provider';

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const db = useDrizzle();
  const projectId = getRouterParam(event, 'id');

  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: 'Project ID is required' });
  }

  const userProject = await getUserProjectWithRole(db, session.user.id, projectId);
  if (!userProject) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' });
  }
  const { role, project } = userProject;
  if (!role) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have access to this project' });
  }

  if (role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Only project admins can manage billing' });
  }

  const provider = getPaymentProvider(event);

  return provider.createPortalSession({
    event,
    project,
  });
});
