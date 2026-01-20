import { z } from 'zod';
import crypto from 'crypto';

const bodySchema = z.object({
  token: z.string(),
  password: z.string().min(8),
  turnstileToken: z.string(),
});

export default defineEventHandler(async (event) => {
  const db = useDrizzle();

  const { token, password, turnstileToken } = await readValidatedBody(event, bodySchema.parse);

  const turnstileResponse = await verifyTurnstileToken(turnstileToken);
  if (!turnstileResponse.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid captcha. Please try again.',
    });
  }

  const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await db.select().from(tables.users).where(eq(tables.users.resetToken, resetTokenHash)).get();

  if (!user) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid or expired reset token',
    });
  }

  if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Reset token has expired',
    });
  }

  const hashedPassword = await hashPassword(password);

  await db
    .update(tables.users)
    .set({
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    })
    .where(eq(tables.users.id, user.id));

  return setResponseStatus(event, 204); // No Content status code
});
