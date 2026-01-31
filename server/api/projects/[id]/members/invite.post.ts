import crypto from 'node:crypto';
import { eq, and } from 'drizzle-orm';
import * as tables from '~~/server/db/schema';
import { getUserProjectWithRole } from '~~/server/db/queries';
import { sendInvitationEmail } from '~~/server/utils/resend';

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

  if (userProject.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only admins can invite members',
    });
  }

  const { email, role } = await readBody(event);

  if (!email || !role) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email and role are required',
    });
  }

  if (role !== 'admin' && role !== 'member') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid role',
    });
  }

  const existingMember = await db
    .select()
    .from(tables.projectMembers)
    .innerJoin(tables.users, eq(tables.projectMembers.userId, tables.users.id))
    .where(and(eq(tables.projectMembers.projectId, projectId), eq(tables.users.email, email)))
    .limit(1);

  if (existingMember.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User is already a member of this project',
    });
  }

  const existingInvitation = await db
    .select()
    .from(tables.invitations)
    .where(
      and(
        eq(tables.invitations.projectId, projectId),
        eq(tables.invitations.email, email),
        eq(tables.invitations.status, 'pending')
      )
    )
    .limit(1);

  if (existingInvitation.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'An invitation has already been sent to this email',
    });
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invitationToken = crypto.randomBytes(32).toString('hex');
  const invitationTokenHash = crypto.createHash('sha256').update(invitationToken).digest('hex');

  const [invitation] = await db
    .insert(tables.invitations)
    .values({
      id: invitationTokenHash,
      projectId,
      invitedByUserId: session.user.id,
      email,
      role,
      status: 'pending',
      expiresAt,
    })
    .returning();

  const config = useRuntimeConfig(event);

  await sendInvitationEmail({
    email,
    inviterName: session.user.email,
    projectName: userProject.project.name,
    role,
    invitationId: invitationToken,
    siteUrl: config.public.siteUrl,
  });

  return invitation;
});
