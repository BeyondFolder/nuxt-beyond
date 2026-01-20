import { getUserProjectWithRole } from '~~/server/db/queries';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import type { ProjectConfiguration } from '#shared/types';
import { sendSupportAnswerEmail } from '~~/server/utils/resend';
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

  const { answer } = await readValidatedBody(
    event,
    z
      .object({
        answer: z.string().min(1, 'Answer is required'),
      })
      .parse
  );

  const question = await db.query.questions.findFirst({
    where: (q, { and, eq }) => and(eq(q.id, questionId), eq(q.projectId, projectId)),
    with: {
      project: true,
    },
  });

  if (!question) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Question not found',
    });
  }

  await db.insert(tables.questionReplies).values({
    questionId,
    userId: session.user.id,
    replyText: answer,
  });

  const updateData: {
    status: 'answered';
    answeredAt: Date;
    assignedToUserId: string;
    answer?: string;
  } = {
    status: 'answered',
    answeredAt: new Date(),
    assignedToUserId: session.user.id,
  };

  await db
    .update(tables.questions)
    .set(updateData)
    .where(and(eq(tables.questions.id, questionId), eq(tables.questions.projectId, projectId)));

  const projectMembers = await db.query.projectMembers.findMany({
    where: (member, { eq }) => eq(member.projectId, projectId),
    with: {
      user: true,
    },
  });

  const memberEmails = projectMembers.map((m) => m.user.email);
  const projectConfiguration = question.project.configuration as ProjectConfiguration;
  const primaryColor = projectConfiguration?.appearance?.primaryColor;

  await sendSupportAnswerEmail({
    customerEmail: question.userEmail,
    customerName: question.userName,
    projectName: question.project.name,
    question: question.initialQuestion,
    answer,
    memberEmails,
    primaryColor,
  });

  return {
    success: true,
    message: 'Answer sent successfully',
  };
});
