import { z } from 'zod';
import { H3Error } from 'h3';
import { blob } from 'hub:blob';

const bodySchema = z.object({
  query: z.string().min(1, 'Query is required').max(1000, 'Query too long'),
  turnstileToken: z.string().min(1, 'Captcha validation required'),
});

export default defineEventHandler(async (event) => {
  const filename = getFreeAiChatbotFilename(event);

  const rateLimit = await checkRateLimit(event, {
    maxRequests: 30,
    windowMs: 60 * 60 * 1000,
    keyPrefix: 'free-chatbot-chat',
  });

  if (!rateLimit.allowed) {
    const resetDate = new Date(rateLimit.resetAt);
    throw createError({
      statusCode: 429,
      statusMessage: `Too many requests. Please try again after ${resetDate.toLocaleTimeString()}.`,
    });
  }

  const { query, turnstileToken } = await readValidatedBody(event, bodySchema.parse);

  const turnstileResponse = await verifyTurnstileToken(turnstileToken);
  if (!turnstileResponse.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Captcha validation failed',
    });
  }

  try {
    const fileExists = await blob.head(`${FREE_AI_CHATBOT_BLOB_PREFIX}/${filename}`);
    if (!fileExists?.customMetadata?.jobId) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Content not found',
      });
    }

    const autorag = event.context.cloudflare.env.AI.autorag(process.env.CLOUDFLARE_AUTO_RAG_ID!);
    const result = await autorag.aiSearch({
      query,
      rewrite_query: true,
      max_num_results: 5,
      ranking_options: {
        score_threshold: 0.4,
      },
      filters: {
        type: 'eq',
        key: 'filename',
        value: filename,
      },
    });

    return {
      response: result.response,
    };
  } catch (error) {
    console.error('Error processing chat query:', error);

    if (error instanceof H3Error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process chat query',
    });
  }
});
