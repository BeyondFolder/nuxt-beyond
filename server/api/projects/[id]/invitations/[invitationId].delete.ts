import { eq, and } from 'drizzle-orm';
import * as tables from '~~/server/db/schema';
import { getUserProjectWithRole } from '~~/server/db/queries';

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const projectId = getRouterParam(event, 'id');
  const invitationId = getRouterParam(event, 'invitationId');

  if (!projectId || !invitationId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project ID and Invitation ID are required',
    });
  }

  const db = useDrizzle();

  const userProject = await getUserProjectWithRole(db, session.user.id, projectId);

  if (!userProject) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You do not have access to this project',
    });
  }

  if (userProject.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only admins can cancel invitations',
    });
  }

  const invitation = await db
    .select()
    .from(tables.invitations)
    .where(and(eq(tables.invitations.id, invitationId), eq(tables.invitations.projectId, projectId)))
    .limit(1);

  if (invitation.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Invitation not found',
    });
  }

  await db.delete(tables.invitations).where(eq(tables.invitations.id, invitationId));

  return { success: true };
});
