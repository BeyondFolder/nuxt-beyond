import { z } from 'zod';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';
import type { VideoCreateParams } from 'openai/resources/videos';
import { DEMO_CONFIG } from '#shared/demo';
import { kv } from 'hub:kv'

export default defineEventHandler(async (event) => {
  const today = new Date().toDateString();
  const demoVideosKey = `demo:videos:${today}`;

  const videoCount = await kv.get<number>(demoVideosKey) || 0;

  if (videoCount >= DEMO_CONFIG.maxVideosPerDay) {
    throw createError({
      statusCode: 429,
      statusMessage: `Demo video generation limit reached (${DEMO_CONFIG.maxVideosPerDay} per day). This limit helps us manage demo costs. Clone NuxtBeyond from GitHub to run your own instance.`,
    });
  }

  const { user } = await requireUserSession(event);

  const body = await readValidatedBody(
    event,
    z.object({
      prompt: z.string().min(1).max(1000),
      imageBase64: z.string().nullish(),
    }).parse
  );

  const db = useDrizzle();

  const title = body.prompt.length > 30 ? body.prompt.substring(0, 30) + '...' : body.prompt;

  const [chat] = await db
    .insert(tables.videoChats)
    .values({
      userId: user.id,
      title,
    })
    .returning();

  if (!chat) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create video chat' });
  }

  await db.insert(tables.videoChatMessages).values({
    chatId: chat.id,
    role: 'user',
    prompt: body.prompt,
  });

  if (!process.env.OPENAI_API_KEY) {
    throw createError({ statusCode: 500, statusMessage: 'OpenAI API key not configured' });
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const createParams: VideoCreateParams = {
      model: 'sora-2',
      prompt: body.prompt,
    };

    if (body.imageBase64) {
      const parts = body.imageBase64.split(',');
      if (parts.length !== 2) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid image data format' });
      }
      const [metadata = '', base64Data = ''] = parts;
      const mimeType = metadata.match(/:(.*?);/)?.[1] || 'image/jpeg';
      const extension = mimeType.split('/')[1] || 'jpg';
      const imageBuffer = Buffer.from(base64Data, 'base64');
      const imageFile = new File([imageBuffer as any], `reference.${extension}`, { type: mimeType });
      createParams.input_reference = imageFile;
      console.log(
        'Starting video generation with image reference (type:',
        mimeType,
        ') for prompt:',
        body.prompt,
        '...'
      );
    } else {
      console.log('Starting video generation for prompt:', body.prompt, '...');
    }

    const result = await openai.videos.create(createParams);

    console.log('Video generation started successfully. Job ID:', result.id, 'for prompt:', body.prompt);

    await db.insert(tables.videoChatMessages).values({
      chatId: chat.id,
      role: 'assistant',
      prompt: body.prompt,
      jobId: result.id,
      status: 'processing',
    });

    await kv.set(demoVideosKey, videoCount + 1, {
      ttl: 60 * 60 * 24,
    });

    return {
      ...chat,
      messages: [
        { role: 'user', prompt: body.prompt },
        { role: 'assistant', prompt: body.prompt, jobId: result.id, status: 'processing' },
      ],
    };
  } catch (error: any) {
    console.error('Video generation error for prompt:', body.prompt, 'Error:', error);
    await db.delete(tables.videoChats).where(eq(tables.videoChats.id, chat.id));
    throw createError({
      statusCode: 500,
      statusMessage: error.message || error.toString() || 'Failed to generate video',
    });
  }
});
