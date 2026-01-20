import { z } from 'zod';
import { PLANS_CONSTANTS } from '#shared/constants';
import { getUserProjectWithRole, updateProjectFileCount } from '~~/server/db/queries';
import { validateFileUploadLimit } from '~~/server/utils/billing';
import { blob } from 'hub:blob';
import { createWorkersAI } from 'workers-ai-provider';
import { generateText } from 'ai';

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

  const maxTextLength = PLANS_CONSTANTS[project.planName].MAX_TEXT_LENGTH;
  const bodySchema = z.object({
    knowledgeText: z
      .string()
      .min(1, 'Text content is required')
      .max(maxTextLength, `Text must be ${maxTextLength.toLocaleString()} characters or less`),
  });

  const { knowledgeText } = await readValidatedBody(event, bodySchema.parse);

  // Check current file count and validate against plan limits
  const { currentCount } = await validateFileUploadLimit(project);

  try {
    const workersai = createWorkersAI({
      binding: event.context.cloudflare.env.AI,
      gateway: {
        id: process.env.CLOUDFLARE_AI_GATEWAY_ID!,
      },
    });
    const { text: title } = await generateText({
      model: workersai('@cf/meta/llama-3.1-8b-instruct-fp8'),
      prompt: `You are a title generator for a chat:
        - Generate a short title based on the first user's message
        - The title should be less than 30 characters long
        - The title should be a summary of the user's message
        - Do not use quotes (' or ") or colons (:) or any other punctuation
        - Do not use markdown, just plain text
        - Only return the title, no other text
        
        User message: ${knowledgeText}
        `,
    });

    const fileName = encodeURIComponent(title);

    await blob.put(`${fileName}.txt`, knowledgeText, {
      prefix: `projects/${projectId}/text`,
      contentType: 'text/plain',
      customMetadata: {
        userId: session.user.id.toString(),
      },
    });

    await updateProjectFileCount(db, project, currentCount + 1);

    return setResponseStatus(event, 201); // Created status code
  } catch (error) {
    console.error('Error uploading text to R2:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to upload text content',
    });
  }
});
