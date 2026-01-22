import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
  streamText,
  stepCountIs,
  type UIMessage,
} from 'ai';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { createWorkersAI } from 'workers-ai-provider';

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const { id } = getRouterParams(event);

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Chat ID is required' });
  }

  const db = useDrizzle();

  const chat = await db.query.userChats.findFirst({
    where: (chat, { eq, and }) => and(eq(chat.id, id), eq(chat.userId, user.id)),
    with: {
      messages: true,
    },
  });

  if (!chat) {
    throw createError({ statusCode: 404, statusMessage: 'Chat not found' });
  }

  const { messages } = await readValidatedBody(
    event,
    z.object({
      messages: z.array(z.custom<UIMessage>()),
    }).parse
  );

  if (!chat.title) {
    const workersai = createWorkersAI({
      binding: event.context.cloudflare.env.AI,
      gateway: {
        id: process.env.CLOUDFLARE_AI_GATEWAY_ID!,
      },
    });
    const { text: title } = await generateText({
      model: workersai('@cf/meta/llama-3.1-8b-instruct-fp8'),
      prompt: `You are a title generator for a chat:
        - Generate a short title based on the following user's message
        - The title should be less than 30 characters long
        - The title should be a summary of the user's message
        - Do not use quotes (' or ") or colons (:) or any other punctuation
        - Do not use markdown, just plain text
        - Only return the title, no other text

        User message: ${JSON.stringify(messages[0])}
        `,
    });

    await db
      .update(tables.userChats)
      .set({ title })
      .where(eq(tables.userChats.id, id));
  }

  const lastMessage = messages[messages.length - 1];

  if (lastMessage?.role === 'user') {
    if (messages.length > 1 && chat.messages.length < messages.length) {
      await db.insert(tables.userChatMessages).values({
        chatId: id,
        role: 'user',
        parts: lastMessage.parts,
      });
    }
  }

  const workersAI = createWorkersAI({
    binding: event.context.cloudflare.env.AI,
    gateway: {
      id: process.env.CLOUDFLARE_AI_GATEWAY_ID!,
    },
  });

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const result = streamText({
        model: workersAI('@cf/meta/llama-3.3-70b-instruct-fp8-fast'),
        messages: await convertToModelMessages(messages),
        stopWhen: [stepCountIs(5)],
      });

      if (!chat.title) {
        writer.write({
          type: 'data-chat-title',
          data: { message: 'Generating title...' },
          transient: true,
        });
      }

      writer.merge(result.toUIMessageStream());
    },
    onFinish: async ({ messages }) => {
      await db.insert(tables.userChatMessages).values(
        messages.map((message) => ({
          chatId: id,
          role: message.role as 'user' | 'assistant',
          parts: message.parts,
        }))
      );
    },
  });

  return createUIMessageStreamResponse({
    stream,
  });
});
