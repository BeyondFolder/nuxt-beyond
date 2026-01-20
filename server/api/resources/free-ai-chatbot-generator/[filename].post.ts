import { z } from 'zod';
import { H3Error } from 'h3';
import { blob } from 'hub:blob'

const bodySchema = z.object({
  query: z.string().min(1, 'Query is required').max(1000, 'Query too long'),
  turnstileToken: z.string().min(1, 'Captcha validation required'),
});

export default defineEventHandler(async (event) => {
  const filename = getRouterParam(event, 'filename');

  if (!filename) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Filename is required',
    });
  }

  const { query, turnstileToken } = await readValidatedBody(event, bodySchema.parse);

  try {
    // Verify Turnstile token
    const turnstileResponse = await verifyTurnstileToken(turnstileToken);
    if (!turnstileResponse.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Captcha validation failed',
      });
    }

    // Check if file exists in R2 storage
    const filePath = `resources/free-ai-chatbot-generator/${filename}`;

    const fileExists = await blob.head(filePath);
    if (!fileExists || !fileExists.customMetadata?.jobId) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Content not found',
      });
    }

    console.log('Chatting with file:', filePath, 'with query:', query);

    const autorag = event.context.cloudflare.env.AI.autorag(process.env.CLOUDFLARE_AUTO_RAG_ID!);
    const result = await autorag.aiSearch({
      query: query,
      // model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
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

    if (error instanceof H3Error && error.statusCode === 404) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process chat query',
    });
  }
});
