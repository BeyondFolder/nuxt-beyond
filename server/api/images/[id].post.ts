import { z } from 'zod';
import { generateImage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { blob } from 'hub:blob';
import { DEMO_CONFIG } from '#shared/demo';
import { kv } from 'hub:kv'

export default defineEventHandler(async (event) => {
  const today = new Date().toDateString();
  const demoImagesKey = `demo:images:${today}`;

  const imageCount = await kv.get<number>(demoImagesKey) || 0;

  if (imageCount >= DEMO_CONFIG.maxImagesPerDay) {
    throw createError({
      statusCode: 429,
      statusMessage: `Demo image generation limit reached (${DEMO_CONFIG.maxImagesPerDay} per day). This limit helps us manage demo costs. Clone NuxtBeyond from GitHub to run your own instance.`,
    });
  }

  const { user } = await requireUserSession(event);
  const { id } = getRouterParams(event);

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Image chat ID is required' });
  }

  const body = await readValidatedBody(
    event,
    z.object({
      prompt: z.string().min(1).max(1000),
      sourceImageUrl: z.string(),
    }).parse
  );

  const db = useDrizzle();

  const chat = await db.query.imageChats.findFirst({
    where: (chat, { eq, and }) => and(eq(chat.id, id), eq(chat.userId, user.id)),
  });

  if (!chat) {
    throw createError({ statusCode: 404, statusMessage: 'Image chat not found' });
  }

  await db.insert(tables.imageChatMessages).values({
    chatId: chat.id,
    role: 'user',
    prompt: body.prompt,
    sourceImageUrl: body.sourceImageUrl,
  });

  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });
  const modelOpenAI = openai.image('gpt-image-1.5');

  try {
    const blobPath = body.sourceImageUrl.replace('/blob/', '');
    const sourceBlob = await blob.get(blobPath);

    if (!sourceBlob) {
      throw createError({ statusCode: 404, statusMessage: 'Source image not found' });
    }

    const sourceBuffer = Buffer.from(await sourceBlob.arrayBuffer());

    console.log('Editing image for prompt:', body.prompt, '...');

    // Can't use Cloudflare AI Gateway here, prompt format is not supported yet
    const result = await generateImage({
      model: modelOpenAI,
      prompt: {
        text: body.prompt,
        images: [sourceBuffer],
      },
    });

    console.log('Image edited for prompt:', body.prompt);

    const imageBuffer = Buffer.from(result.image.base64, 'base64');
    const filename = `images/${user.id}/${chat.id}/${crypto.randomUUID()}.png`;

    await blob.put(filename, imageBuffer, {
      contentType: 'image/png',
    });

    const imageUrl = `/blob/${filename}`;

    await db.insert(tables.imageChatMessages).values({
      chatId: chat.id,
      role: 'assistant',
      prompt: body.prompt,
      imageUrl,
      sourceImageUrl: body.sourceImageUrl,
    });

    await kv.set(demoImagesKey, imageCount + 1, {
      ttl: 60 * 60 * 24,
    });

    return {
      role: 'assistant',
      prompt: body.prompt,
      imageUrl,
      sourceImageUrl: body.sourceImageUrl,
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to generate image',
    });
  }
});
