import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { generateImage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { blob } from 'hub:blob';
import { createAiGateway } from 'ai-gateway-provider';

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);

  const body = await readValidatedBody(
    event,
    z.object({
      prompt: z.string().min(1).max(1000),
    }).parse
  );

  const db = useDrizzle();

  const title = body.prompt.length > 30 ? body.prompt.substring(0, 30) + '...' : body.prompt;

  const [chat] = await db
    .insert(tables.imageChats)
    .values({
      userId: user.id,
      title,
    })
    .returning();

  if (!chat) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create image chat' });
  }

  await db.insert(tables.imageChatMessages).values({
    chatId: chat.id,
    role: 'user',
    prompt: body.prompt,
  });

  if (!process.env.OPENAI_API_KEY) {
    throw createError({ statusCode: 500, statusMessage: 'OpenAI API key not configured' });
  }

  const aiGateway = createAiGateway({
    binding: event.context.cloudflare.env.AI.gateway(process.env.CLOUDFLARE_AI_GATEWAY_ID!),
  });
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });
  const modelOpenAI = aiGateway([openai.image('gpt-image-1.5')]);

  try {
    console.log('Generating image for prompt:', body.prompt, '...');

    const result = await generateImage({
      model: modelOpenAI,
      prompt: body.prompt,
      size: '1024x1024',
    });

    console.log('Image generated for prompt:', body.prompt);

    const image = result.image;

    const imageBuffer = Buffer.from(image.base64, 'base64');
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
    });

    return {
      ...chat,
      messages: [
        { role: 'user', prompt: body.prompt },
        { role: 'assistant', prompt: body.prompt, imageUrl },
      ],
    };
  } catch (error: any) {
    console.error('Image generation error:', error);
    await db.delete(tables.imageChats).where(eq(tables.imageChats.id, chat.id));
    throw createError({
      statusCode: 500,
      statusMessage: error.message || error.toString() || 'Failed to generate image',
    });
  }
});
