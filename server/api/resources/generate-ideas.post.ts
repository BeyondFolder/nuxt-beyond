import { createWorkersAI } from 'workers-ai-provider';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { validateUserMessage } from '~~/server/utils/ai';

const ideaSchema = z.object({
  ideas: z.array(
    z.object({
      name: z.string(),
      oneLiner: z.string(),
      problem: z.string(),
      targetAudience: z.string(),
      monetization: z.enum(['freemium', 'subscription', 'one-time', 'usage-based']),
      complexity: z.enum(['weekend', 'side-project', 'full-product']),
      techStack: z.array(z.string()),
    })
  ),
});

export default defineEventHandler(async (event) => {
  const rateLimitResult = await checkRateLimit(event, {
    maxRequests: 5,
    windowMs: 30 * 60 * 1000,
    keyPrefix: 'saas-ideas-gen',
  });

  if (!rateLimitResult.allowed) {
    throw createError({
      statusCode: 429,
      message: `Rate limit exceeded. Try again in ${Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000 / 60)} minutes.`,
    });
  }

  const allowedCategories = [
    'AI/ML Tools', 'Developer Tools', 'Productivity', 'Marketing/Sales',
    'Education', 'Healthcare', 'Finance', 'E-commerce', 'Content/Media',
    'HR/Recruiting', 'Real Estate', 'Legal/Compliance',
  ];
  const allowedComplexities = [
    'Weekend project (1-2 days)', 'Side project (1-2 weeks)', 'Full product (1-3 months)',
  ];

  const body = await readBody(event);
  const { description, category, complexity } = body;

  if (!description || description.length < 10 || description.length > 500) {
    throw createError({
      statusCode: 400,
      message: 'Please provide a description between 10 and 500 characters.',
    });
  }

  if (!validateUserMessage(description)) {
    throw createError({
      statusCode: 400,
      message: 'Your description contains invalid content. Please rephrase and try again.',
    });
  }

  const safeCategory = allowedCategories.includes(category) ? category : null;
  const safeComplexity = allowedComplexities.includes(complexity) ? complexity : null;

  const categoryHint = safeCategory ? `Focus on the "${safeCategory}" category.` : '';
  const complexityHint = safeComplexity ? `Ideas should be "${safeComplexity}" level complexity.` : '';

  const prompt = `You are a SaaS idea generator for solo developers and small teams.

Based on this user profile: "${description}"
${categoryHint}
${complexityHint}

Generate exactly 6 unique, realistic SaaS product ideas. Each idea must be something a solo developer could actually build and monetize.

Requirements:
- Every idea must include "Nuxt 4" in the techStack
- Ideas should be specific and actionable, not generic
- Target audiences should be specific (not "everyone")
- Mix of B2B and B2C, but lean B2B
- Make ideas relevant to 2026 (AI, remote work, creator economy, etc.)
- Each idea should have a different monetization model if possible
- monetization must be one of: freemium, subscription, one-time, usage-based
- complexity must be one of: weekend, side-project, full-product`;

  const workersai = createWorkersAI({
    binding: event.context.cloudflare.env.AI,
    gateway: {
      id: process.env.CLOUDFLARE_AI_GATEWAY_ID!,
    },
  });

  try {
    const { output } = await generateText({
      model: workersai('@cf/meta/llama-3.3-70b-instruct-fp8-fast'),
      prompt,
      maxOutputTokens: 2000,
      output: Output.object({ schema: ideaSchema }),
    });

    if (!output) {
      throw createError({ statusCode: 500, message: 'Failed to generate ideas. Please try again.' });
    }

    return { ideas: output.ideas.slice(0, 6) };
  } catch (err: any) {
    if (err.statusCode) {
      throw err;
    }
    throw createError({ statusCode: 500, message: 'Failed to generate ideas. Please try again.' });
  }
});
