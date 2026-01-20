import { z } from 'zod';
import { getUserWithProject } from '~~/server/db/queries';
import { loginUser } from '~~/server/utils/auth';

const invalidCredentialsError = createError({
  statusCode: 401,
  message: 'Invalid credentials',
});

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  turnstileToken: z.string(),
});

export default defineEventHandler(async (event) => {
  const rateLimit = await checkRateLimit(event, {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
    keyPrefix: 'login',
  });

  if (!rateLimit.allowed) {
    const resetDate = new Date(rateLimit.resetAt);
    throw createError({
      statusCode: 429,
      statusMessage: `Too many login attempts. Please try again after ${resetDate.toLocaleTimeString()}.`,
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

  const result = await getUserWithProject(db, email);

  if (!result || result.length === 0 || result[0].user.provider !== 'credentials') {
    throw invalidCredentialsError;
  }

  const { user, project, role } = result[0];

  if (!user.password || !(await verifyPassword(user.password, password))) {
    throw invalidCredentialsError;
  }

  if (user.verificationToken !== null) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Please verify your email address before logging in. Check your email for the verification link.',
    });
  }

  await loginUser(event, user, 'credentials', project || undefined, role || undefined);

  return setResponseStatus(event, 204); // No Content status code
});
