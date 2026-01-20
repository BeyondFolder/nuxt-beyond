import { getUserProjectWithRole } from '~~/server/db/queries';
import { PLANS_CONSTANTS } from '#shared/constants';

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

  const planConfig = PLANS_CONSTANTS[project.planName];
  if (!planConfig?.SUPPORT_ESCALATION) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Support escalation is not available on your current plan',
    });
  }

  // TODO: Add pagination in the future
  const questions = await db.query.questions.findMany({
    where: (question, { eq }) => eq(question.projectId, projectId),
    orderBy: (question, { desc }) => [desc(question.createdAt)],
  });

  return {
    questions,
    totalCount: questions.length,
  };
});
