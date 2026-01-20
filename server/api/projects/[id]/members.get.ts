import { eq, and } from 'drizzle-orm';
import * as tables from '~~/server/db/schema';
import { getUserProjectWithRole } from '~~/server/db/queries';

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const projectId = getRouterParam(event, 'id');

  if (!projectId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project ID is required',
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

  const members = await db
    .select({
      id: tables.projectMembers.id,
      userId: tables.projectMembers.userId,
      email: tables.users.email,
      role: tables.projectMembers.role,
      joinedAt: tables.projectMembers.joinedAt,
    })
    .from(tables.projectMembers)
    .innerJoin(tables.users, eq(tables.projectMembers.userId, tables.users.id))
    .where(eq(tables.projectMembers.projectId, projectId));

  const invitations = await db
    .select({
      id: tables.invitations.id,
      email: tables.invitations.email,
      role: tables.invitations.role,
      status: tables.invitations.status,
      invitedBy: tables.users.email,
      createdAt: tables.invitations.createdAt,
      expiresAt: tables.invitations.expiresAt,
    })
    .from(tables.invitations)
    .innerJoin(tables.users, eq(tables.invitations.invitedByUserId, tables.users.id))
    .where(and(eq(tables.invitations.projectId, projectId), eq(tables.invitations.status, 'pending')));

  return {
    members,
    invitations,
    currentUserRole: userProject.role,
    currentUserId: session.user.id,
  };
});
