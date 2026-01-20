import { H3Error } from 'h3';
import { getAutoRAGJobDetail, syncAutoRAG } from '~~/server/utils/cloudflare';
import { blob } from 'hub:blob'

export default defineEventHandler(async (event) => {
  const fileName = getRouterParam(event, 'filename');

  if (!fileName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Filename is required',
    });
  }

  try {
    const filePath = `resources/free-ai-chatbot-generator/${fileName}`;

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
      console.log(`Requested syncing of AutoRAG for resource/free-ai-chatbot-generator/${fileName}:`, json);

      jobId = json.result?.job_id;

      if (jobId) {
        const htmlPage = await blob.get(filePath);

        // Also store jobId
        await blob.put(fileName, htmlPage as Blob, {
          prefix: `resources/free-ai-chatbot-generator`,
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
    console.log(`Checking status of syncing of AutoRAG for ${filePath} and jobId ${jobId}:`, json);

    if (json?.errors) {
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
