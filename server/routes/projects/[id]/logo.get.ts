import { getProject } from '~~/server/db/queries';
import type { ProjectConfiguration } from '#shared/types';
import { blob } from 'hub:blob'

export default defineEventHandler(async (event) => {
  const db = useDrizzle();

  const projectId = getRouterParam(event, 'id');
  if (!projectId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project ID is required',
    });
  }

  const project = await getProject(db, projectId);
  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Project not found',
    });
  }

  const currentConfig = (project.configuration as ProjectConfiguration) || {};

  if (!currentConfig?.appearance?.logo) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Project has no logo',
    });
  }

  try {
    const filePath = currentConfig.appearance.logo;

    const fileExists = await blob.head(filePath);
    if (!fileExists) {
      throw createError({
        statusCode: 404,
        statusMessage: 'File not found',
      });
    }

    setHeader(event, 'Content-Security-Policy', "default-src 'none';");
    setHeader(event, 'Cache-Control', "public, max-age=31536000, immutable");

    return blob.serve(event, filePath);
  } catch (error) {
    console.error('Error generating URL for file:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate download URL',
    });
  }
});
