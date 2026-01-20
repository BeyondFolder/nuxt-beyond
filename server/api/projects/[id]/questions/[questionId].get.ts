import { getUserProjectWithRole } from '~~/server/db/queries';
import { PLANS_CONSTANTS } from '#shared/constants';

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const db = useDrizzle();

  const projectId = getRouterParam(event, 'id');
  const questionId = getRouterParam(event, 'questionId');

  if (!projectId || !questionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project ID and Question ID are required',
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

  const question = await db.query.questions.findFirst({
    where: (q, { and, eq }) => and(eq(q.id, questionId), eq(q.projectId, projectId)),
    with: {
      chat: {
        with: {
          messages: {
            orderBy: (message, { asc }) => [asc(message.createdAt)],
          },
        },
      },
      replies: {
        with: {
          user: {
            columns: {
              id: true,
              email: true,
            },
          },
        },
        orderBy: (reply, { asc }) => [asc(reply.createdAt)],
      },
    },
  });

  if (!question) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Question not found',
    });
  }

  return question;
});
