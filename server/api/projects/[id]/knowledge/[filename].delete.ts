import { getUserProjectWithRole, updateProjectFileCount } from '~~/server/db/queries';
import type { ProjectConfiguration } from '#shared/types';
import { H3Error } from 'h3';
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

  if (!filename || filename === 'questions/answers.csv') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Filename is required',
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

  try {
    const pathname = `projects/${projectId}/${filename}`;

    // First check if the file exists using head
    try {
      await blob.head(pathname);
    } catch (error) {
      console.error(`File ${filename} not found in R2:`, error);
      throw createError({
        statusCode: 404,
        statusMessage: 'File not found',
      });
    }

    await blob.del(pathname);

    const config = project.configuration as ProjectConfiguration;
    const currentCount = config?.fileCount || 0;
    const newCount = Math.max(0, currentCount - 1);

    await updateProjectFileCount(db, project, newCount);

    return setResponseStatus(event, 204); // No Content status code
  } catch (error) {
    console.error(`Error deleting file ${filename} from R2:`, error);

    if (error instanceof H3Error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: `Failed to delete file: ${filename}`,
    });
  }
});
