import { z } from 'zod';
import { DEMO_CONFIG } from '#shared/demo';
import { kv } from 'hub:kv';
import { eq } from 'drizzle-orm';
import { VIDEO_GENERATION } from '#shared/constants';

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
  const ai = requireGeminiClient();

  const body = await readValidatedBody(
    event,
    z.object({
      prompt: z.string().min(1).max(1000),
      imageBase64: z.string().nullish(),
    }).parse
  );

  let image: { data: string; mimeType: string } | undefined;

  if (body.imageBase64) {
    const commaIndex = body.imageBase64.indexOf(',');
    const mimeType = body.imageBase64.slice(0, commaIndex).match(/^data:(.+);base64$/)?.[1];
    const data = body.imageBase64.slice(commaIndex + 1);

    if (commaIndex === -1 || !mimeType || !VIDEO_GENERATION.REFERENCE_IMAGE_TYPES.includes(mimeType)) {
      throw createError({ statusCode: 400, statusMessage: `The reference image must be a ${VIDEO_GENERATION.REFERENCE_IMAGE_LABEL} file` });
    }

    if ((data.length * 3) / 4 > VIDEO_GENERATION.MAX_REFERENCE_IMAGE_SIZE) {
      throw createError({ statusCode: 400, statusMessage: 'The reference image is too large' });
    }

    image = { data, mimeType };
  }

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

  try {
    const interaction = await startVideoInteraction(ai, { prompt: body.prompt, image });

    console.log('Video generation started. Interaction ID:', interaction.id, 'status:', interaction.status);

    await db.insert(tables.videoChatMessages).values({
      chatId: chat.id,
      role: 'assistant',
      prompt: body.prompt,
      jobId: interaction.id,
      status: 'processing',
    });

    await kv.set(demoVideosKey, videoCount + 1, {
      ttl: 60 * 60 * 24,
    });

    return {
      ...chat,
      messages: [
        { role: 'user', prompt: body.prompt },
        { role: 'assistant', prompt: body.prompt, jobId: interaction.id, status: 'processing' },
      ],
    };
  } catch (error) {
    console.error('Video generation error:', error);
    await db.delete(tables.videoChats).where(eq(tables.videoChats.id, chat.id));
    throw toVideoHttpError(error);
  }
});
