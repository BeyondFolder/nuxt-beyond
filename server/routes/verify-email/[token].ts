import crypto from 'node:crypto';
import { sendVerificationEmail } from '~~/server/utils/resend';

export default defineEventHandler(async (event) => {
  const db = useDrizzle();

  const token = getRouterParam(event, 'token');

  if (!token) {
    return sendRedirect(event, '/login?error=verification_invalid');
  }

  const verificationTokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await db
    .select()
    .from(tables.users)
    .where(eq(tables.users.verificationToken, verificationTokenHash))
    .get();

  if (!user) {
    return sendRedirect(event, '/login?error=verification_invalid');
  }

  if (!user.verificationTokenExpiry || new Date() > user.verificationTokenExpiry) {
    const newVerificationToken = crypto.randomBytes(32).toString('hex');
    const newVerificationTokenHash = crypto.createHash('sha256').update(newVerificationToken).digest('hex');
    const newVerificationTokenExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours from now

    await db
      .update(tables.users)
      .set({
        verificationToken: newVerificationTokenHash,
        verificationTokenExpiry: newVerificationTokenExpiry,
      })
      .where(eq(tables.users.id, user.id));

    try {
      await sendVerificationEmail(
        user.email,
        newVerificationToken,
        getHeader(event, 'origin') || '',
        true
      );
    } catch (error) {
      console.error('Failed to send new verification email:', error);
      return sendRedirect(event, '/login?error=verification_error');
    }

    return sendRedirect(event, '/login?error=verification_expired');
  }

  await db
    .update(tables.users)
    .set({
      verificationToken: null,
      verificationTokenExpiry: null,
    })
    .where(eq(tables.users.id, user.id));

  return sendRedirect(event, '/login?verified=true');
});
