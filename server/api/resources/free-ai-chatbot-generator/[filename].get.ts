import { H3Error } from 'h3';
import { blob } from 'hub:blob';
import { getAutoRAGJobDetail, syncAutoRAG } from '~~/server/utils/cloudflare';

export default defineEventHandler(async (event) => {
  const fileName = getFreeAiChatbotFilename(event);

  try {
    const filePath = `${FREE_AI_CHATBOT_BLOB_PREFIX}/${fileName}`;

    const fileExists = await blob.head(filePath);
    if (!fileExists) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Content not found',
      });
    }

    let jobId = fileExists.customMetadata?.jobId;

    if (!jobId) {
      // If we don't have job id, request a new sync and save jobId if we can
      const result = await syncAutoRAG(process.env.CLOUDFLARE_AUTO_RAG_ID!);
      const json = await result.json();

      jobId = json.result?.job_id;

      if (jobId) {
        const htmlPage = await blob.get(filePath);

        await blob.put(fileName, htmlPage as Blob, {
          prefix: FREE_AI_CHATBOT_BLOB_PREFIX,
          contentType: 'text/html',
          customMetadata: {
            ...fileExists.customMetadata,
            jobId,
          },
        });
      }

      return {
        isProcessed: false,
      };
    }

    const result = await getAutoRAGJobDetail(process.env.CLOUDFLARE_AUTO_RAG_ID!, jobId);
    const json = await result.json();

    if (json?.errors?.length) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to check content availability',
      });
    }

    return {
      isProcessed: json.success && !!json.result?.ended_at,
      appName: fileExists.customMetadata?.appName,
      appIcon: fileExists.customMetadata?.appIcon,
    };
  } catch (error) {
    console.error('Error checking file existence:', error);

    if (error instanceof H3Error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to check content availability',
    });
  }
});
