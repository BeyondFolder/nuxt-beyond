import { blob } from 'hub:blob';

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const path = getRouterParam(event, 'path');

  if (!path) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Path is required',
    });
  }

  if (path.startsWith('images/')) {
    const parts = path.split('/');
    const userId = parts[1];

    if (userId !== session.user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You do not have access to this file',
      });
    }
  }

  try {
    const fileExists = await blob.head(path);
    if (!fileExists) {
      throw createError({
        statusCode: 404,
        statusMessage: 'File not found',
      });
    }

    setHeader(event, 'Content-Type', 'image/png');
    setHeader(event, 'Cache-Control', 'public, max-age=31536000');

    return blob.serve(event, path);
  } catch (error) {
    console.error('Error serving blob:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to serve file',
    });
  }
});
