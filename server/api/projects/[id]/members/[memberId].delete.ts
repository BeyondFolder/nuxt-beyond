import { eq, and, count } from 'drizzle-orm';
import * as tables from '~~/server/db/schema';
import { getUserProjectWithRole } from '~~/server/db/queries';

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const projectId = getRouterParam(event, 'id');
  const memberId = getRouterParam(event, 'memberId');

  if (!projectId || !memberId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project ID and Member ID are required',
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
      statusMessage: 'Only admins can remove members',
    });
  }

  const member = await db
    .select()
    .from(tables.projectMembers)
    .where(and(eq(tables.projectMembers.id, memberId), eq(tables.projectMembers.projectId, projectId)))
    .limit(1);

  if (member.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Member not found',
    });
  }

  if (member[0]!.userId === session.user.id) {
    const adminCount = await db
      .select({ count: count() })
      .from(tables.projectMembers)
      .where(and(eq(tables.projectMembers.projectId, projectId), eq(tables.projectMembers.role, 'admin')));

    if ((adminCount[0]?.count || 0) <= 1) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cannot remove the last admin from the project',
      });
    }
  }

  await db.delete(tables.projectMembers).where(eq(tables.projectMembers.id, memberId));

  return { success: true };
});
