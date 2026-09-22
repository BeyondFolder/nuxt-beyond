import { getUserProjectWithRole, updateProjectFileCount } from '~~/server/db/queries';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import type { QuestionWithReply } from '~~/server/db/schema';
import { PLANS_CONSTANTS } from '#shared/constants';
import { blob } from 'hub:blob';
import { createWorkersAI } from 'workers-ai-provider';
import { generateText } from 'ai';

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const db = useDrizzle();
  const projectId = getRouterParam(event, 'id');

  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: 'Project ID is required' });
  }

  const userProject = await getUserProjectWithRole(db, session.user.id, projectId);
  if (!userProject) throw createError({ statusCode: 404, statusMessage: "Project not found" });
  const { role, project } = userProject;
  if (!role) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have access to this project' });
  }

  const planConfig = PLANS_CONSTANTS[project.planName];
  if (!planConfig?.SUPPORT_ESCALATION) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Support escalation is not available on your current plan',
    });
  }

  if (!planConfig?.SELF_LEARNING) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Self-learning is not available on your current plan',
    });
  }

  const { questionIds, addToRag } = await readValidatedBody(
    event,
    z.object({
      questionIds: z.array(z.string()).min(1),
      addToRag: z.boolean(),
    }).parse
  );

  const questions = await db.query.questions.findMany({
    where: (q, { and, eq, inArray }) => and(eq(q.projectId, projectId), inArray(q.id, questionIds)),
    with: {
      replies: {
        orderBy: (reply, { asc }) => [asc(reply.createdAt)],
      },
    },
  });

  if (questions.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'No questions found' });
  }

  if (questions.length !== questionIds.length) {
    throw createError({ statusCode: 400, statusMessage: 'Some questions were not found' });
  }

  const pendingQuestions = questions.filter((q) => q.status === 'pending');
  if (pendingQuestions.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'All questions must be answered before adding to knowledge base',
    });
  }

  if (addToRag) {
    const questionsWithoutReplies = questions.filter((q) => !q.replies || q.replies.length === 0);
    if (questionsWithoutReplies.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'All questions must have answers before adding to knowledge base',
      });
    }

    const questionsWithoutAnswers = questions.filter((q) => !q.answer);

    for (const question of questionsWithoutAnswers) {
      const answer = await generateAnswer(
        event.context.cloudflare.env.AI,
        question.initialQuestion,
        question.replies.map((r) => r.replyText)
      );

      await db.update(tables.questions).set({ answer }).where(eq(tables.questions.id, question.id));

      question.answer = answer!;
    }

    await updateKnowledgeBase(projectId, questions, session.user.id.toString());

    await updateProjectFileCount(db, project);

    await db
      .update(tables.questions)
      .set({
        status: 'added_to_rag',
      })
      .where(and(eq(tables.questions.projectId, projectId), inArray(tables.questions.id, questionIds)));

    return {
      success: true,
      message: `${questions.length} question${questions.length > 1 ? 's' : ''} added to knowledge base`,
    };
  } else {
    await removeFromKnowledgeBase(projectId, questions, session.user.id.toString());

    await updateProjectFileCount(db, project);

    await db
      .update(tables.questions)
      .set({
        status: 'answered',
        answer: null,
      })
      .where(and(eq(tables.questions.projectId, projectId), inArray(tables.questions.id, questionIds)));

    return {
      success: true,
      message: `${questions.length} question${questions.length > 1 ? 's' : ''} removed from knowledge base`,
    };
  }
});

async function generateAnswer(aiBinding: unknown, initialQuestion: string, replies: string[]) {
  try {
    const workersai = createWorkersAI({
      binding: aiBinding,
      gateway: {
        id: process.env.CLOUDFLARE_AI_GATEWAY_ID!,
      },
    });
    const { text: answer } = await generateText({
      model: workersai('@cf/meta/llama-3.1-8b-instruct-fp8'),
      prompt: `You are an answer generator for a support question:
          - If one reply: return it as-is
          - If multiple replies: combine them into one clear answer
          - Use the owner's actual words and information - don't add assumptions
          - Remove personal information that may belong to the user, if any (eg. user's email, user's phone number, user's address etc)
          - The answer should be less than 255 characters long
          - Do not use quotes (' or ") or colons (:) or any other punctuation
          - Do not use markdown, just plain text
          - Return ONLY the answer, no other text
        
        Initial Question: ${initialQuestion}\n\nReplies: ${replies.join('\n')}
        `,
    });

    console.log('For Initial Question:', initialQuestion, 'Replies: ', replies, 'Generated Answer:', answer);

    return answer;
  } catch (error) {
    console.error('Error generating answer:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate answer',
    });
  }
}

async function updateKnowledgeBase(projectId: string, questions: QuestionWithReply[], userId: string) {
  const filePath = `projects/${projectId}/questions/answers.csv`;

  let csvContent = 'Initial Question,Answer\n';

  let fileExists;
  try {
    fileExists = await blob.head(filePath);

    if (fileExists) {
      const blobData = await blob.get(filePath);

      if (blobData) {
        csvContent = await blobData.text();
      }
    }
  } catch (_) {
    // No existing CSV yet, start from an empty one
  }

  const lines = csvContent.split('\n').filter((line) => line.trim());
  const header = lines[0];
  const dataRows = lines.slice(1);

  const csvMap = new Map<string, string>();

  for (const row of dataRows) {
    const match = row.match(/^"?([^"]*)"?,"?([^"]*)"?$/);
    if (match) {
      const question = (match[1] ?? '').replace(/""/g, '"').trim();
      const answer = (match[2] ?? '').replace(/""/g, '"').trim();
      csvMap.set(question, answer);
    }
  }

  for (const question of questions) {
    const normalizedQuestion = question.initialQuestion.trim();
    const normalizedAnswer = (question.answer || '').trim();

    csvMap.set(normalizedQuestion, normalizedAnswer);
  }

  const escapeCsvField = (field: string) => {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };

  const updatedLines = [header];
  for (const [question, answer] of csvMap.entries()) {
    updatedLines.push(`${escapeCsvField(question)},${escapeCsvField(answer)}`);
  }

  const updatedCsvContent = updatedLines.join('\n') + '\n';

  await blob.put(filePath, updatedCsvContent, {
    contentType: 'text/csv',
    customMetadata: {
      userId,
    },
  });
}

async function removeFromKnowledgeBase(projectId: string, questions: QuestionWithReply[], userId: string) {
  const filePath = `projects/${projectId}/questions/answers.csv`;

  let fileExists;
  try {
    fileExists = await blob.head(filePath);
  } catch (_) {
    fileExists = false;
  }

  if (!fileExists) {
    return;
  }

  const blobData = await blob.get(filePath);
  const csvContent = (await blobData?.text()) || '';

  const lines = csvContent.split('\n').filter((line) => line.trim());
  const header = lines[0];
  const dataRows = lines.slice(1);

  const csvMap = new Map<string, string>();

  for (const row of dataRows) {
    const match = row.match(/^"?([^"]*)"?,"?([^"]*)"?$/);
    if (match) {
      const question = (match[1] ?? '').replace(/""/g, '"').trim();
      const answer = (match[2] ?? '').replace(/""/g, '"').trim();
      csvMap.set(question, answer);
    }
  }

  for (const question of questions) {
    const normalizedQuestion = question.initialQuestion.trim();
    csvMap.delete(normalizedQuestion);
  }

  const escapeCsvField = (field: string) => {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };

  const updatedLines = [header];
  for (const [question, answer] of csvMap.entries()) {
    updatedLines.push(`${escapeCsvField(question)},${escapeCsvField(answer)}`);
  }

  const updatedCsvContent = updatedLines.join('\n') + '\n';

  await blob.put(filePath, updatedCsvContent, {
    contentType: 'text/csv',
    customMetadata: {
      userId,
    },
  });
}
