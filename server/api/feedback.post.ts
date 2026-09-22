import { z } from 'zod';
import { sendFeedbackEmail } from '~~/server/utils/resend';

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { message, turnstileToken } = await readValidatedBody(
    event,
    z.object({
      message: z.string().min(1, 'Message is required'),
      turnstileToken: z.string(),
    }).parse
  );

  const turnstileResponse = await verifyTurnstileToken(turnstileToken);
  if (!turnstileResponse.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid captcha. Please try again.',
    });
  }

  const userEmail = session.user.email;
  const userName = userEmail;

  await sendFeedbackEmail({
    userEmail,
    userName,
    message,
  });

  return {
    success: true,
    message: 'Feedback sent successfully',
  };
});
