import type { H3Event } from 'h3';

export const FREE_AI_CHATBOT_BLOB_PREFIX = 'resources/free-ai-chatbot-generator';

const FREE_AI_CHATBOT_FILENAME_REGEX = /^\d+-[A-Za-z0-9._-]+\.html$/;

export function getFreeAiChatbotFilename(event: H3Event) {
  const filename = getRouterParam(event, 'filename');

  if (!filename || !FREE_AI_CHATBOT_FILENAME_REGEX.test(filename)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid filename',
    });
  }

  return filename;
}
