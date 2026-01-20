import { z } from 'zod';
import crypto from 'crypto';
import { sendVerificationEmail } from '~~/server/utils/resend';

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  turnstileToken: z.string(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the Terms of Service and Privacy Policy',
  }),
});

export default defineEventHandler(async (event) => {
  const rateLimit = await checkRateLimit(event, {
    maxRequests: 3,
    windowMs: 15 * 60 * 1000,
    keyPrefix: 'register',
  });

  if (!rateLimit.allowed) {
    const resetDate = new Date(rateLimit.resetAt);
    throw createError({
      statusCode: 429,
      statusMessage: `Too many registration attempts. Please try again after ${resetDate.toLocaleTimeString()}.`,
    });
  }

  const db = useDrizzle();

  const { email, password, turnstileToken } = await readValidatedBody(event, bodySchema.parse);

  const turnstileResponse = await verifyTurnstileToken(turnstileToken);
  if (!turnstileResponse.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid captcha. Please try again.',
    });
  }

  const hashedPassword = await hashPassword(password);
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
  const verificationTokenExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours from now

  let user;
  try {
    user = await db
      .insert(tables.users)
      .values({
        email,
        password: hashedPassword,
        provider: 'credentials',
        verificationToken: verificationTokenHash,
        verificationTokenExpiry,
      })
      .returning()
      .get();
  } catch (e) {
    console.error('Error inserting user:', e);
    throw createError({
      statusCode: 400,
      statusMessage: 'User already exists',
    });
  }

  try {
    await sendVerificationEmail(
      email,
      verificationToken,
      getHeader(event, 'origin') || '',
      false
    );
  } catch (error) {
    console.error('Failed to send verification email:', error);
    await db.delete(tables.users).where(eq(tables.users.id, user.id));
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send verification email. Please try again.',
    });
  }

  return { email };
});
