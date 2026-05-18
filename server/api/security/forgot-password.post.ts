import { z } from 'zod';
import crypto from 'node:crypto';
import { sendPasswordResetEmail } from '~~/server/utils/resend';

const bodySchema = z.object({
  email: z.email(),
  turnstileToken: z.string(),
});

export default defineEventHandler(async (event) => {
  const db = useDrizzle();

  const { email, turnstileToken } = await readValidatedBody(event, bodySchema.parse);

  const turnstileResponse = await verifyTurnstileToken(turnstileToken);
  if (!turnstileResponse.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid captcha. Please try again.',
    });
  }

  const user = await db.select().from(tables.users).where(eq(tables.users.email, email)).get();

  if (!user) {
    return;
  }

  if (user.provider !== 'credentials') {
    throw createError({
      statusCode: 400,
      statusMessage: 'This email is registered with a social provider. Please use that to sign in.',
    });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

  await db
    .update(tables.users)
    .set({
      resetToken: resetTokenHash, // Stored hashed token in db
      resetTokenExpiry,
    })
    .where(eq(tables.users.email, email));

  try {
    await sendPasswordResetEmail(
      email,
      resetToken,
      getHeader(event, 'origin') || ''
    );
  } catch (error) {
    console.error('Failed to send reset email:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send reset email. Please try again.',
    });
  }

  return setResponseStatus(event, 204); // No Content status code
});
