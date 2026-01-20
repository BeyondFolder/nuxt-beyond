import { z } from 'zod';
import { getAudienceId, getResend } from '~~/server/utils/resend';
import { H3Error } from 'h3';

const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
  turnstileToken: z.string(),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    const { email, turnstileToken } = subscribeSchema.parse(body);

    const turnstileResponse = await verifyTurnstileToken(turnstileToken);
    if (!turnstileResponse.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid captcha. Please try again.',
      });
    }

    console.log('📧 New email subscription:', email);

    await getResend().contacts.create({
      email,
      audienceId: getAudienceId(),
    });

    return setResponseStatus(event, 201); // Created status code
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: error.errors[0]?.message || 'Invalid input',
      });
    }

    if (error instanceof H3Error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to subscribe. Please try again.',
    });
  }
});
