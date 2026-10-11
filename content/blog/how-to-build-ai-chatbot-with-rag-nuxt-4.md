---
title: 'How to Build an AI Chatbot with RAG in Nuxt 4 (Step-by-Step)'
description: 'A practical guide to building a RAG chatbot in Nuxt 4 using Cloudflare AI Search (AutoRAG), R2, and the Vercel AI SDK, with real code for ingestion, retrieval, and streaming.'
seo:
  title: 'Nuxt RAG Tutorial - Build an AI Chatbot with Cloudflare AutoRAG (2026)'
  description: 'Step-by-step Cloudflare AutoRAG tutorial for Nuxt 4: set up R2 and AI Search, ingest documents, run semantic search, and stream answers with the Vercel AI SDK v6.'
image:
  src: /images/homepage/demo2.png
authors:
  - name: Rares
    to: https://x.com/Raress96_
    avatar:
      src: /images/avatar.png
date: 2026-08-15
badge:
  label: Tutorial
---

Most "AI chatbot" tutorials stop at wiring `streamText` to an OpenAI key. That gets you a chatbot that knows nothing about your product and confidently makes things up when a customer asks about your refund policy.

RAG (retrieval augmented generation) fixes that. You store your docs somewhere searchable, retrieve the relevant chunks at question time, and hand them to the model as context. The model answers from your content instead of its training data.

This guide walks through building that in Nuxt 4 on Cloudflare, using AI Search (the feature formerly called AutoRAG) so you don't have to run your own embedding pipeline or vector database. Every code snippet here is close to what actually runs in [NuxtBeyond](/#pricing), so it's tested in production rather than sketched out for a blog post.

## What we're building

A support chatbot that:

1. Ingests documents (PDFs, markdown, scraped pages) into R2
2. Indexes them automatically with Cloudflare AI Search
3. Searches them semantically when a user asks a question
4. Streams an answer back through the Vercel AI SDK v6
5. Escalates to a human when it can't find an answer

The whole thing runs on Cloudflare Workers. No Postgres with pgvector, no Pinecone bill, no separate embedding worker.

## Why Cloudflare AI Search instead of a vector DB

The classic RAG stack is: chunk the document, call an embedding model, store vectors in Pinecone or pgvector, then at query time embed the question, run a similarity search, rerank, and stitch the results into a prompt. That's five moving parts you now own.

Cloudflare AI Search collapses it into one. You point an AI Search instance at an R2 bucket, and it handles chunking, embedding, indexing, and query rewriting for you. You drop a file in the bucket, trigger a sync, and it's searchable.

The tradeoffs are real, so here they are up front:

- You get less control over chunking strategy and embedding models
- Indexing isn't instant (a sync job takes anywhere from seconds to a few minutes depending on volume)
- You're on Cloudflare, and moving off it means rebuilding the retrieval layer

For a support bot or a docs assistant, I'll take that trade every time. The custom pipeline is worth building when retrieval quality is your product, not when it's a feature.

## Prerequisites

- A Nuxt 4 project (`npx nuxi@latest init my-app`)
- A Cloudflare account with Workers Paid (AI Search needs it)
- [NuxtHub](https://hub.nuxt.com/docs) installed for the R2 and D1 bindings
- An OpenAI API key
- Node 20+

Install the AI pieces:

```bash
npm install ai @ai-sdk/openai ai-gateway-provider zod
npx nuxi module add hub
```

## Step 1: set up your bindings

Cloudflare bindings live in `wrangler.jsonc`. You need the AI binding (for both the model gateway and AI Search) and an R2 bucket to hold documents.

```jsonc
{
  "name": "my-rag-app",
  "compatibility_date": "2025-12-14",
  "compatibility_flags": ["nodejs_compat"],
  "ai": {
    "binding": "AI",
    "remote": true
  },
  "r2_buckets": [
    {
      "binding": "BLOB",
      "remote": true,
      "bucket_name": "my-rag-bucket"
    }
  ]
}
```

Note `"remote": true` on both. This matters more than it looks, and I'll come back to it in the local dev section.

## Step 2: create the AI Search instance

This part happens in the Cloudflare dashboard, not in code.

Go to AI, then AI Search, and create a new instance. Pick R2 as the data source and select the bucket you just declared. Cloudflare will ask for an embedding model and a generation model. For the embedding model, the default `@cf/baai/bge-m3` is fine. The generation model doesn't matter much here because we're going to use the search endpoint directly and generate the answer ourselves with the AI SDK.

Grab the instance name (something like `my-rag-instance`) and put it in `.env` along with your account ID and an API token scoped to AI Search:

```bash
CLOUDFLARE_ACCOUNT_ID=xxx
CLOUDFLARE_AUTO_RAG_ID=my-rag-instance
CLOUDFLARE_AUTO_RAG_API_TOKEN=xxx
CLOUDFLARE_AI_GATEWAY_ID=my-gateway
OPENAI_API_KEY=sk-xxx
```

The API token is only needed for the sync endpoints (step 4). Search itself goes through the `AI` binding, which needs no token.

## Step 3: ingest documents into R2

Upload is just an R2 write. The important decision here is your **folder layout**, because folders are how you scope search later.

If you're building a multi-tenant product, put every tenant's files under their own prefix. Do this on day one. Retrofitting tenant isolation into a flat bucket is miserable.

```ts
// server/api/knowledge/index.post.ts
import { blob } from 'hub:blob';

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const form = await readFormData(event);
  const file = form.get('file') as File;

  if (!file) {
    throw createError({ statusCode: 400, statusMessage: 'No file provided' });
  }

  const projectId = form.get('projectId') as string;
  const filename = `projects/${projectId}/files/${file.name}`;

  await blob.put(filename, Buffer.from(await file.arrayBuffer()), {
    contentType: file.type,
  });

  return { filename };
});
```

AI Search reads PDFs, plain text, markdown, HTML, and a few others directly. If you're ingesting web pages, scrape them first (Cloudflare's Browser Rendering binding works well for this) and write the extracted text as a `.txt` or `.md` file under a `pages/` prefix. Storing raw HTML works but wastes tokens on nav markup.

## Step 4: trigger a sync and track the job

Files sitting in R2 aren't searchable until AI Search indexes them. It polls on a schedule, but you don't want your user waiting on that. Trigger a sync manually right after upload.

```ts
// server/utils/cloudflare.ts
export async function syncAutoRAG(instance: string) {
  return await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/autorag/rags/${instance}/sync`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_AUTO_RAG_API_TOKEN}`,
      },
    }
  );
}

export async function getAutoRAGJobDetail(instance: string, jobId: string) {
  return await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/autorag/rags/${instance}/jobs/${jobId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_AUTO_RAG_API_TOKEN}`,
      },
    }
  );
}
```

The sync call returns a `job_id`. Store it on the project or user record, then poll the job detail endpoint from the client to show a real progress state. A job is done when `result.ended_at` is set:

```ts
const response = await getAutoRAGJobDetail(instance, jobId);
const json = await response.json();
const isProcessed = json.success && !!json.result?.ended_at;
```

One gotcha: `ended_at` comes back in GMT without a timezone suffix. If you're storing it as a Date, append the `Z` yourself (`new Date(\`${json.result.ended_at}Z\`)`) or you'll get timestamps that drift by your server's offset.

## Step 5: search the knowledge base

This is the retrieval half of RAG. The `AI` binding exposes `autorag(instance).search()`, and it handles query rewriting and ranking for you.

```ts
const findRelevantContent = async (question: string, projectId: string) => {
  const autorag = event.context.cloudflare.env.AI.autorag(
    process.env.CLOUDFLARE_AUTO_RAG_ID!
  );

  const searchResult = await autorag.search({
    query: question,
    rewrite_query: true,
    max_num_results: 5,
    ranking_options: {
      score_threshold: 0.4,
    },
    filters: {
      type: 'and',
      filters: [
        { type: 'gt', key: 'folder', value: `projects/${projectId}//` },
        { type: 'lte', key: 'folder', value: `projects/${projectId}/z` },
      ],
    },
  });

  return searchResult.data.map((item) => ({
    filename: item.filename,
    content: item.content.map((c) => c.text).join('\n'),
    score: item.score,
  }));
};
```

Three parameters do most of the work here.

`rewrite_query: true` reformulates the user's message into a better search query before embedding it. Users type "how much is it" and mean "what is the pricing." Query rewriting closes that gap and it's worth the extra latency.

`score_threshold: 0.4` is your hallucination guard. Without it, a question with no good match still returns the five least-bad chunks, and the model will dutifully synthesize an answer from irrelevant text. With a threshold, you get an empty array and can escalate instead. Tune it: 0.4 is a reasonable starting point, higher means fewer but more precise results.

The `folder` filter is the tenant isolation trick. AI Search doesn't have a native prefix filter, so you fake one with a range comparison: everything greater than `projects/{id}//` and less than or equal to `projects/{id}/z` lands inside that project's folder and nowhere else. It looks odd. It works, and it means one AI Search instance can serve every tenant.

## Step 6: give the model a search tool

Now the generation half. Instead of stuffing search results into the prompt yourself, expose search as a **tool** and let the model decide when to call it. That way "hi" doesn't trigger a vector search, and a follow-up question can trigger a second one with better phrasing.

```ts
// server/api/chat.post.ts
import { streamText, tool, convertToModelMessages, stepCountIs } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAiGateway } from 'ai-gateway-provider';
import { z } from 'zod';

export default defineEventHandler(async (event) => {
  const { messages, projectId } = await readBody(event);

  const aiGateway = createAiGateway({
    binding: event.context.cloudflare.env.AI.gateway(
      process.env.CLOUDFLARE_AI_GATEWAY_ID!
    ),
  });
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const model = aiGateway([openai('gpt-5.1-chat-latest')]);

  const result = streamText({
    model,
    system: `You are a support assistant for Acme.

HOW TO RESPOND:
1. Search the knowledge base first, silently. Never mention the knowledge base.
2. If results are found, answer using ONLY that information.
3. If nothing relevant comes back, say so and offer to connect the user with support.
4. Never invent policies, prices, or features.`,
    messages: await convertToModelMessages(messages),
    stopWhen: [stepCountIs(5)],
    tools: {
      getInformation: tool({
        description: 'Search the knowledge base for any customer question. Use this FIRST.',
        inputSchema: z.object({
          question: z.string().describe('the user question'),
        }),
        execute: async ({ question }) => findRelevantContent(question, projectId),
      }),
    },
    toolChoice: 'auto',
  });

  return result.toUIMessageStreamResponse();
});
```

Two details worth calling out.

`stopWhen: [stepCountIs(5)]` caps the agent loop. A tool call plus the model responding is 2 steps, so 5 gives room for a search, a follow-up search, and a final answer without letting it spin.

Routing through Cloudflare AI Gateway (`createAiGateway`) gets you caching, rate limiting, and per-request logs across every model call. It also lets you pass an array of models as fallbacks, so if OpenAI returns a 500 the gateway retries against the next one. Costs nothing extra and saves you building observability yourself.

Instructing the model to "never mention the knowledge base" sounds like a small thing. It isn't. Without it you get answers that open with "Based on the documents I searched..." on every single reply, which reads like a robot reciting its own plumbing.

## Step 7: the streaming UI

The client side is short. `useChat` from `@ai-sdk/vue` handles the stream, message state, and input binding.

```vue
<script setup lang="ts">
import { Chat } from '@ai-sdk/vue';
import { DefaultChatTransport } from 'ai';

const props = defineProps<{ projectId: string }>();
const input = ref('');

const chat = new Chat({
  transport: new DefaultChatTransport({
    api: '/api/chat',
    body: { projectId: props.projectId },
  }),
});

const send = () => {
  if (!input.value.trim()) {
    return;
  }
  chat.sendMessage({ text: input.value });
  input.value = '';
};
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-for="message in chat.messages" :key="message.id">
      <p class="text-sm text-muted">{{ message.role }}</p>
      <template v-for="(part, i) in message.parts" :key="i">
        <p v-if="part.type === 'text'">{{ part.text }}</p>
        <p v-else-if="part.type === 'tool-getInformation'" class="text-muted text-sm">
          Searching...
        </p>
      </template>
    </div>

    <UInput v-model="input" placeholder="Ask a question" @keydown.enter="send" />
  </div>
</template>
```

Rendering the tool-call part as "Searching..." is a small touch that makes a big difference. Retrieval adds a second or two of latency, and users read silence as "it's broken."

## Local development: the part that trips everyone up

AI Search reads from R2 in the cloud. It cannot see files written to your local `.data` directory by the default dev server. So `npm run dev` with local bindings will happily accept uploads and then return zero search results forever, with no error to explain why.

You need remote bindings:

```bash
nuxthub dev --remote
```

Or define a `remote` environment in `wrangler.jsonc` with `"remote": true` on the AI and R2 bindings and run against that. Either way, the rule is simple: **anything touching AI Search must run against remote resources.** I lost an evening to this before it clicked.

## Deploying

```bash
npx nuxthub deploy
```

Set your environment variables in the Cloudflare dashboard under Variables and Secrets. Keep `CLOUDFLARE_AUTO_RAG_API_TOKEN` and `OPENAI_API_KEY` as secrets, not plain vars.

## Things that will bite you

**Sync latency.** A freshly uploaded file isn't instantly searchable. Show a processing state and poll the job endpoint rather than pretending it's synchronous.

**Prompt injection.** If users can upload documents or you scrape third-party pages, someone will eventually plant "ignore previous instructions" in the content. Retrieved chunks land in the model's context, so treat them as untrusted input, sanitize what you index, and validate user messages before they hit the model.

**Cost.** Every question triggers an embedding call plus a generation call, and a chatty widget on a busy site adds up fast. Rate limit per session (Workers KV is perfect for this) before you launch, not after your first surprise bill.

**Chunk quality beats model choice.** If answers are bad, the problem is almost always retrieval, not the model. Log what `findRelevantContent` returns for the questions people actually ask. Nine times out of ten you'll find the right document was never in the bucket.

## Or skip the wiring

Everything above is roughly two weeks of work once you add document management, tenant scoping, sync polling, rate limiting, and a widget your customers can embed on their own site.

That's what [NuxtBeyond](/#pricing) ships with: Cloudflare AI Search retrieval, the Vercel AI SDK v6 streaming stack, multi-tenant projects, an embeddable chat widget with domain validation, auth, and billing on both [Stripe and Polar](/blog/stripe-vs-polar-which-to-choose). It's :launch-price one-time with lifetime updates.

If you're still comparing options, I wrote a [full breakdown of Nuxt SaaS boilerplates](/blog/best-nuxt-boilerplates-compared) and a [head-to-head with Supastarter](/blog/supastarter-vs-nuxtbeyond). NuxtBeyond is the only one on that list with RAG in the box, which is the whole reason I built it.

Either way, build the thing. RAG on Cloudflare is genuinely less work than the tutorials make it look.

---

*Questions or a correction? [Find me on X](https://x.com/Raress96_).*
