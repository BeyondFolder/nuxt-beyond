import { getUserProjectWithRole } from '~~/server/db/queries';
import type { ProjectConfiguration } from '#shared/types';
import { syncAutoRAG } from '~~/server/utils/cloudflare';

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

  const configuration = (project?.configuration as ProjectConfiguration) || {};

  if (
    !configuration?.filesUpdatedAt ||
    (configuration?.finishedProcessingAt && configuration?.finishedProcessingAt > configuration?.filesUpdatedAt) ||
    (configuration?.requestProcessingAt && new Date(configuration?.requestProcessingAt) > new Date(configuration?.filesUpdatedAt))
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Can not request syncing if files have not been updated.',
    });
  }

  try {
    const result = await syncAutoRAG(process.env.CLOUDFLARE_AUTO_RAG_ID!);
    const json = await result.json();

    console.log(
      `Requested syncing of AutoRAG from project ${projectId}, user ${session.user.id}, result:`,
      json
    );

    const jobId = json.result?.job_id;

    if (!jobId) {
      return setResponseStatus(event, 400); // Bad request
    }

    await db
      .update(tables.projects)
      .set({
        configuration: {
          ...configuration,
          requestProcessingAt: new Date(),
          requestProcessingJobId: jobId,
          finishedProcessingAt: undefined,
        } as ProjectConfiguration,
        updatedAt: new Date(),
      })
      .where(eq(tables.projects.id, projectId))
      .returning()
      .get();

    return setResponseStatus(event, 204); // No content status code
  } catch (error) {
    console.error(`Filed to request syncing from project ${projectId}, user ${session.user.id}`, error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to request syncing',
    });
  }
});
