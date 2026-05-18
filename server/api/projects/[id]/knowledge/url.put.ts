import { z } from 'zod';
import { getUserProjectWithRole, updateProjectFileCount } from '~~/server/db/queries';
import { validateFileUploadLimit } from '~~/server/utils/billing';
import { H3Error } from 'h3';
import { blob } from 'hub:blob'
import { hubBrowser } from '~~/server/utils/browser';

const bodySchema = z.object({
  url: z.url('Please enter a valid URL'),
});

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

  const { url } = await readValidatedBody(event, bodySchema.parse);

  // Check current file count and validate against plan limits
  const { currentCount } = await validateFileUploadLimit(project);

  try {
    const newUrl = new URL(url);
    const fileName = encodeURIComponent(newUrl.toString());

    const { page } = await hubBrowser(event, {
      keepAlive: 60, // default 60 seconds; free limits are 10 minutes, so check usage
    });

    await page.goto(url);
    const htmlPage = await page.content();

    // We need to do this for better and faster RAG
    await blob.put(`${fileName}.html`, htmlPage, {
      prefix: `projects/${projectId}/pages`,
      contentType: 'text/html',
      customMetadata: {
        userId: session.user.id.toString(),
        originalUrl: url,
      },
    });

    await updateProjectFileCount(db, project, currentCount + 1);

    return setResponseStatus(event, 201); // Created status code
  } catch (error) {
    console.error('Error uploading html to R2:', error);

    if (error instanceof H3Error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to upload html content',
    });
  }
});
