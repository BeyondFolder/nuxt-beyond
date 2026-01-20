import { getUserProjectWithRole } from '~~/server/db/queries';
import type { ProjectConfiguration } from '#shared/types';
import { getAutoRAGJobDetail } from '~~/server/utils/cloudflare';

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

  if (!configuration?.requestProcessingJobId || configuration?.finishedProcessingAt) {
    return {
      isProcessing: false,
      finishedProcessingAt: configuration?.finishedProcessingAt,
    };
  }

  try {
    const result = await getAutoRAGJobDetail(
      process.env.CLOUDFLARE_AUTO_RAG_ID!,
      configuration.requestProcessingJobId
    );
    const json = await result.json();

    console.log(`Checking status of AutoRAG job ${configuration.requestProcessingJobId} for project ${projectId}:`, json);

    if (json?.errors) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to check processing status',
      });
    }

    const isProcessed = json.success && !!json.result?.ended_at;

    if (isProcessed && !configuration?.finishedProcessingAt) {
      await db
        .update(tables.projects)
        .set({
          configuration: {
            ...configuration,
            finishedProcessingAt: new Date(`${json.result?.ended_at}Z`), // ended_at is in GMT time, update to appropriate value
          } as ProjectConfiguration,
          updatedAt: new Date(),
        })
        .where(eq(tables.projects.id, projectId))
        .returning()
        .get();
    }

    return {
      isProcessed,
      finishedProcessingAt: isProcessed ? new Date(`${json.result?.ended_at}Z`) : configuration?.finishedProcessingAt,
    };
  } catch (error) {
    console.error(`Failed to check processing status for project ${projectId}`, error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to check processing status',
    });
  }
});
