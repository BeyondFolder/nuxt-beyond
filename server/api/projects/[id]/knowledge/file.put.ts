import { ALLOWED_FILE_TYPES, PLANS_CONSTANTS } from '#shared/constants';
import { getUserProjectWithRole, updateProjectFileCount } from '~~/server/db/queries';
import { validateFileUploadLimit } from '~~/server/utils/billing';
import type { BlobSize } from '@nuxthub/core/blob';
import type { MimeType } from '@uploadthing/mime-types';
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

  const userProject = await getUserProjectWithRole(db, session.user.id, projectId);
  if (!userProject) throw createError({ statusCode: 404, statusMessage: "Project not found" });
  const { role, project } = userProject;
  if (!role) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You do not have access to this project',
    });
  }

  const maxFileSize = PLANS_CONSTANTS[project.planName].MAX_FILE_SIZE;

  const form = await readFormData(event);
  const file = form.get('file') as File;

  if (!file || !file.size) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No file provided',
    });
  }

  ensureBlob(file, {
    maxSize: `${maxFileSize}B` as BlobSize,
    types: ALLOWED_FILE_TYPES as MimeType[],
  });

  const { currentCount } = await validateFileUploadLimit(project);

  const filename = encodeURIComponent(file.name);

  try {
    await blob.put(filename, file, {
      prefix: `projects/${projectId}/files`,
      customMetadata: {
        userId: session.user.id.toString(),
        fileType: file.type,
      },
    });

    await updateProjectFileCount(db, project, currentCount + 1);

    return setResponseStatus(event, 201); // Created status code
  } catch (error) {
    console.error(`Error uploading file ${filename} to R2:`, error);
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to upload file: ${filename}`,
    });
  }
});
