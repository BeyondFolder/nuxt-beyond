import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import * as tables from '~~/server/db/schema';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const token = query.token as string;

  if (!token) {
    return sendRedirect(event, '/login?error=invalid_invitation');
  }

  const db = useDrizzle();

  const invitationTokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const invitation = await db
    .select()
    .from(tables.invitations)
    .where(eq(tables.invitations.id, invitationTokenHash))
    .limit(1);

  if (invitation.length === 0) {
    return sendRedirect(event, '/?error=invitation_not_found');
  }

  const inv = invitation[0]!;

  if (inv.status !== 'pending') {
    return sendRedirect(event, '/?error=invitation_already_processed');
  }

  await db
    .update(tables.invitations)
    .set({ status: 'declined' })
    .where(eq(tables.invitations.id, invitationTokenHash));

  return sendRedirect(event, '/?invitation_declined=true');
});
