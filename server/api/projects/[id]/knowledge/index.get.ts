import { getUserProjectRole } from '~~/server/db/queries';
import { blob } from 'hub:blob'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const db = useDrizzle();

  const projectId = getRouterParam(event, 'id');
  if (!projectId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project ID is required',
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
    const { blobs } = await blob.list({ prefix: `projects/${projectId}` });

    const processedBlobs = blobs.map((blob) => ({
      key: blob.pathname.replace(`projects/${projectId}/`, ''),
      size: blob.size,
      uploadedAt: blob.uploadedAt,
      fileType: blob.customMetadata?.fileType || blob.contentType,
    })).filter(obj => !obj.key.endsWith('questions/answers.csv'));

    return {
      files: processedBlobs,
      totalCount: processedBlobs.length,
    };
  } catch (error) {
    console.error('Error listing blobs for project:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve knowledge base files',
    });
  }
});
