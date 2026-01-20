import { z } from 'zod';
import OpenAI from 'openai';

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const { id } = getRouterParams(event);

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Video chat ID is required' });
  }

  const body = await readValidatedBody(
    event,
    z.object({
      prompt: z.string().min(1).max(1000),
      previousVideoId: z.string().optional(),
    }).parse
  );

  const db = useDrizzle();

  const chat = await db.query.videoChats.findFirst({
    where: (chat, { eq, and }) => and(eq(chat.id, id), eq(chat.userId, user.id)),
  });

  if (!chat) {
    throw createError({ statusCode: 404, statusMessage: 'Video chat not found' });
  }

  await db.insert(tables.videoChatMessages).values({
    chatId: chat.id,
    role: 'user',
    prompt: body.prompt,
    previousVideoId: body.previousVideoId,
  });

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    let result;

    if (body.previousVideoId) {
      console.log('Remixing video:', body.previousVideoId, 'with prompt:', body.prompt, '...');

      result = await openai.videos.remix(body.previousVideoId, {
        prompt: body.prompt,
      });

      console.log('Video remix started successfully. Job ID:', result.id, 'for prompt:', body.prompt);
    } else {
      console.log('Starting video generation for prompt:', body.prompt, '...');

      result = await openai.videos.create({
        model: 'sora-2',
        prompt: body.prompt,
      });

      console.log('Video generation started successfully. Job ID:', result.id, 'for prompt:', body.prompt);
    }

    await db.insert(tables.videoChatMessages).values({
      chatId: chat.id,
      role: 'assistant',
      prompt: body.prompt,
      jobId: result.id,
      status: 'processing',
      previousVideoId: body.previousVideoId,
    });

    return {
      role: 'assistant',
      prompt: body.prompt,
      jobId: result.id,
      status: 'processing',
      previousVideoId: body.previousVideoId,
    };
  } catch (error: any) {
    console.error('Video generation/remix error for prompt:', body.prompt, 'Error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to generate video',
    });
  }
});
