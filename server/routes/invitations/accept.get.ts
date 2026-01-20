import crypto from 'crypto';
import { eq, and } from 'drizzle-orm';
import * as tables from '~~/server/db/schema';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const token = query.token as string;

  if (!token) {
    return sendRedirect(event, '/login?error=invalid_invitation');
  }

  const session = await getUserSession(event);

  if (!session?.user) {
    return sendRedirect(event, `/login?redirect=${encodeURIComponent(`/invitations/accept?token=${token}`)}`);
  }

  const db = useDrizzle();

  const invitationTokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const invitation = await db
    .select()
    .from(tables.invitations)
    .where(eq(tables.invitations.id, invitationTokenHash))
    .limit(1);

  if (invitation.length === 0) {
    return sendRedirect(event, '/dashboard?error=invitation_not_found');
  }

  const inv = invitation[0]!;

  if (inv.status !== 'pending') {
    return sendRedirect(event, '/dashboard?error=invitation_already_processed');
  }

  if (new Date() > inv.expiresAt) {
    return sendRedirect(event, '/dashboard?error=invitation_expired');
  }

  if (session.user.email !== inv.email) {
    return sendRedirect(event, '/dashboard?error=invitation_email_mismatch');
  }

  const existingMember = await db
    .select()
    .from(tables.projectMembers)
    .where(and(eq(tables.projectMembers.userId, session.user.id), eq(tables.projectMembers.projectId, inv.projectId)))
    .limit(1);

  if (existingMember.length > 0) {
    return sendRedirect(event, '/dashboard?error=already_member');
  }

  await db.insert(tables.projectMembers).values({
    projectId: inv.projectId,
    userId: session.user.id,
    role: inv.role,
  });

  await db
    .update(tables.invitations)
    .set({ status: 'accepted' })
    .where(eq(tables.invitations.id, invitationTokenHash));

  await setUserSession(event, {
    ...session,
    projectId: inv.projectId,
  });

  return sendRedirect(event, '/dashboard?invitation_accepted=true');
});
