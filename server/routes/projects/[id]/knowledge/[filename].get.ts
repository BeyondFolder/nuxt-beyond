import { getUserProjectRole } from '~~/server/db/queries';
import { blob } from 'hub:blob'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const db = useDrizzle();

  const projectId = getRouterParam(event, 'id');
  const filename = getRouterParam(event, 'filename');

  if (!projectId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project ID is required',
    });
  }

  if (!filename) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Filename is required',
    });
  }

  const role = await getUserProjectRole(db, session.user.id, projectId);
  if (!role) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You do not have access to this project',
    });
  }

  try {
    const filePath = `projects/${projectId}/${filename}`;

    console.log(await blob.list());

    const fileExists = await blob.head(filePath);
    if (!fileExists) {
      throw createError({
        statusCode: 404,
        statusMessage: 'File not found',
      });
    }

    setHeader(event, 'Content-Security-Policy', "default-src 'none';");

    return blob.serve(event, filePath);
  } catch (error) {
    console.error('Error generating download URL for file:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate download URL',
    });
  }
});
