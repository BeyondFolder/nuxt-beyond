---
title: 'ShipFast vs Nuxt Beyond: Which SaaS Boilerplate Should You Pick?'
description: 'An honest comparison of ShipFast (Next.js, $199-249) and Nuxt Beyond (Nuxt 4, $59). Features, AI, pricing, community, and when each boilerplate is the right call.'
seo:
  title: 'ShipFast vs Nuxt Beyond: SaaS Boilerplate Comparison (2026)'
  description: 'ShipFast vs Nuxt Beyond in 2026. Next.js vs Nuxt 4, AI and RAG, Cloudflare vs Vercel, $199 vs $59, and which SaaS boilerplate fits the product you are actually building.'
image:
  src: /images/homepage/demo2.png
authors:
  - name: Rares
    to: https://x.com/Raress96_
    avatar:
      src: /images/avatar.png
date: 2026-09-19
badge:
  label: Comparison
---

I built Nuxt Beyond, so this is not a neutral review. I will still tell you when ShipFast is the better buy, because for a lot of people it is.

ShipFast comes up in almost every boilerplate conversation. Marc Lou shipped it, 8,100+ people bought it, and the Discord is huge. If you search "SaaS boilerplate" you will hit it. Nuxt Beyond is a Nuxt 4 starter I built for AI products: RAG chat, an embeddable widget, Stripe, and Cloudflare at the edge, for $59.

If you want the wider Nuxt field (Supastarter, Supersaas, ShipAhead, NuxtBase), I already wrote a [full Nuxt 4 boilerplate comparison](/blog/best-nuxt-boilerplates-compared). This post is the head-to-head people actually search: ShipFast vs Nuxt Beyond.

## The short version

**ShipFast** is a Next.js SaaS kit with auth, Stripe, a blog, emails, and a giant community. It is $199-249 one-time. It does not ship AI. It does not ship multi-tenancy. The default database is MongoDB.

**Nuxt Beyond** is a Nuxt 4 kit built around AI: Cloudflare AutoRAG, streaming chat, an embeddable widget, DALL-E 3 and Sora, plus auth, Stripe (and Polar), and project-based multi-tenancy. It is $59 one-time. The community is small. Auth is basic.

Pick ShipFast if you are a React developer who wants the most popular kit and you are not building an AI product. Pick Nuxt Beyond if you want Vue/Nuxt, RAG, or a chatbot you can embed on customer sites.

## Feature comparison

| Feature | ShipFast ($199-249) | Nuxt Beyond ($59) |
|---------|---------------------|-------------------|
| **Framework** | Next.js (React) | Nuxt 4 (Vue 3) |
| **AI chat** | No | Vercel AI SDK v6, streaming, tool calling |
| **RAG / semantic search** | No | Cloudflare AutoRAG |
| **Embeddable widget** | No | One-line script, domain validation |
| **Image / video gen** | No | DALL-E 3 + OpenAI Sora |
| **Prompt injection protection** | No | Yes |
| **Auth** | NextAuth (Google, magic links) | Google OAuth + email/password |
| **Payments** | Stripe, Lemon Squeezy | Stripe + Polar |
| **Multi-tenancy** | No | Project-based workspaces |
| **Database** | MongoDB or Supabase | Cloudflare D1 (SQLite at the edge) + Drizzle |
| **Deployment** | Vercel | Cloudflare Workers (NuxtHub) |
| **Blog** | Yes | Yes (Nuxt Content) |
| **Email** | Yes | Resend |
| **i18n** | No | No |
| **Community** | 8,100+ users, 5,000+ Discord | Small (launched January 2026) |

## Where ShipFast wins

I am not going to pretend community does not matter. For a boilerplate, it often matters more than a feature checklist.

### Community and social proof

8,100+ buyers and a 5,000+ Discord is a different category from a kit that launched in January 2026. If you get stuck, someone has already hit that error. Templates, launch posts, and "I shipped with this" screenshots exist in volume. That is real leverage, especially if you are shipping your first product and you want a crowd to stand next to.

Nuxt Beyond does not have that. I will not dress it up.

### Marketing muscle

Marc Lou is good at distribution. The landing page, the emails, the "ship in a weekend" story: it is a product in its own right. A lot of people buy ShipFast because they want that energy as much as the repo.

Nuxt Beyond is quieter. The product is the AI stack, not a personal brand engine.

### React ecosystem

If your team already thinks in React, Next.js, and Vercel, ShipFast sits on the path of least resistance. Hiring is easier. Tutorials are everywhere. You will not spend a week arguing about Vue vs React in a group chat.

That is a fair reason to pay $199 and move on.

### Battle testing

Thousands of production apps have gone through ShipFast's auth, Stripe webhooks, and deploy path. Edge cases get filed. Nuxt Beyond has been through production on my own products, but it has not been through thousands of other founders' products. If you need "this has been beaten on," ShipFast wins.

## Where the frameworks actually differ

This is not a religious Vue vs React post. It is the part that changes how you write the app.

ShipFast is Next.js. App Router, React Server Components, `app/api` routes, Vercel as the default home. Nuxt Beyond is Nuxt 4: file-based pages, server routes under `server/api`, Vue 3 `<script setup>`, and Cloudflare Workers via NuxtHub.

A Stripe checkout session in Nuxt 4 looks like a Nitro handler, not a Next.js route:

```ts
// server/api/stripe/checkout.post.ts
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const { priceLookupKey } = await readBody(event)
  const stripe = useStripe()

  const prices = await stripe.prices.list({
    lookup_keys: [priceLookupKey],
    expand: ['data.product'],
  })

  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    mode: 'subscription',
    line_items: [{ price: prices.data[0].id, quantity: 1 }],
    success_url: `${getRequestURL(event).origin}/dashboard?checkout=success`,
    cancel_url: `${getRequestURL(event).origin}/#pricing`,
  })

  return { url: session.url }
})
```

The Next.js version is the same Stripe call in a different file. The interesting difference is not syntax. It is where the process runs.

ShipFast wants Vercel. Serverless Node, or whatever Vercel is this year. Nuxt Beyond wants Cloudflare Workers: D1 for the database, R2 for files, KV for rate limits, AI Gateway for model calls. Cold starts and regional latency look different. So does the bill at 10k users.

If you already live in Vercel, ShipFast will feel like home. If you want one vendor for compute, database, storage, and RAG, the Cloudflare path is the point of Nuxt Beyond. I wrote a longer version of that deploy story in [Deploying a multi-tenant SaaS to Cloudflare Workers](/blog/multi-tenant-saas-cloudflare-workers-nuxt-4).

Vue vs React is a preference until it is not. Nuxt's server/client split is boring in a good way: `server/api`, `useFetch`, no "use client" breadcrumbs. Next's App Router is more powerful and easier to trip over. Neither is a reason to rewrite a working product. It is a reason to pick the stack you will still enjoy in six months.

## The AI gap is not a footnote

ShipFast has zero AI features. In 2026 that is the whole conversation for a large set of products.

You can add OpenAI to anything. A `fetch` to `/v1/chat/completions` is an afternoon. That is not what people mean when they say they are building an AI SaaS.

They mean: documents go in, embeddings happen, answers come back from *their* content, streaming works, the model has tools, you do not leak tenant A’s PDF to tenant B, and someone can paste a script tag on a marketing site. That is weeks. Sometimes months.

Nuxt Beyond ships that path. Retrieval goes through Cloudflare AI Search (AutoRAG). One AI Search instance serves every tenant because results are filtered by folder:

```ts
const findRelevantContent = async (question: string, projectId: string) => {
  const autorag = event.context.cloudflare.env.AI.autorag(
    process.env.CLOUDFLARE_AUTO_RAG_ID!
  )

  const searchResult = await autorag.search({
    query: question,
    rewrite_query: true,
    max_num_results: 5,
    ranking_options: { score_threshold: 0.4 },
    filters: {
      type: 'and',
      filters: [
        { type: 'gt', key: 'folder', value: `projects/${projectId}//` },
        { type: 'lte', key: 'folder', value: `projects/${projectId}/z` },
      ],
    },
  })

  return searchResult.data.map((item) => ({
    filename: item.filename,
    content: item.content.map((c) => c.text).join('\n'),
    score: item.score,
  }))
}
```

`rewrite_query` turns "how much is it" into a search for pricing. `score_threshold` stops the model from answering out of the five least-bad chunks. The folder range is tenant isolation without standing up a vector database per customer.

The generation side is Vercel AI SDK v6 `streamText` with a `getInformation` tool, so "hi" does not trigger a vector search and a follow-up can. Prompt injection protection and response sanitization sit in front of that. I walked through the full pipeline in [How to build an AI chatbot with RAG in Nuxt 4](/blog/how-to-build-ai-chatbot-with-rag-nuxt-4).

With ShipFast you start from a working SaaS shell and *then* design ingestion, chunking, embeddings, retrieval filters, streaming, and evals. That is the right call if AI is a "maybe later" checkbox. It is the wrong call if the product *is* the chatbot.

Image and video generation is the same split. Nuxt Beyond has DALL-E 3 and Sora wired. ShipFast does not. If your product is "type a prompt, get an image," you are not buying ShipFast for that.

## Database and hosting, without the tribal war

ShipFast defaults to MongoDB, with Supabase (Postgres) as an option. A lot of indie hackers like Mongo because it is fast to sketch. A lot of other indie hackers will argue with you about it for free.

Nuxt Beyond uses Cloudflare D1 (SQLite at the edge) and Drizzle. Queries are typed. There is no connection pool to babysit on Workers. The tradeoff is SQLite, not Postgres: no heavy relational gymnastics, no row-level security from Supabase, and you design around D1’s limits.

I am not going to tell you SQLite is "just as good as Postgres" for every app. If you know you need Postgres (postgis, serious reporting, a team that already runs Supabase), ShipFast’s Supabase option or a Nuxt kit that speaks Postgres (ShipAhead, Supastarter) is cleaner. If you want the database next to the Worker that served the request, D1 is the reason Nuxt Beyond exists.

Cost follows the same line. Vercel plus Mongo Atlas plus a vector DB plus OpenAI is four invoices. Cloudflare’s free tiers on D1, R2, and KV cover a surprising amount of an early SaaS. You still pay for models. You do not pay for a second database just to do RAG.

## Multi-tenancy and the widget

ShipFast is a single-product SaaS shape: one user, one account, one Stripe customer. That is enough for a lot of indie tools.

It is not enough if you sell to teams, or if each customer is a workspace with its own knowledge base, members, and billing. Nuxt Beyond models that as projects: switch project, scope chats and files to `projects/{id}/`, invite members. The RAG filter above is the same ID.

The embeddable widget is the other business-model difference. ShipFast will get you a SaaS you log into. Nuxt Beyond will also get you a bubble on someone else’s site:

```html
<script>
  window.__nuxtbeyond_config = {
    projectId: 'proj_123',
    primaryColor: '#0d9488',
    position: 'bottom-right',
  }
</script>
<script src="https://yourdomain.com/embed.js" async></script>
```

That script is the easy part. The hard part is iframe isolation, third-party cookies (Safari will drop them), domain allowlists so random sites cannot burn your credits, and KV rate limits. That work is already in the repo. Full walkthrough: [How to build an embeddable chat widget in Nuxt 4](/blog/embeddable-chat-widget-nuxt-4).

If you are building chatbot-as-a-service, this is the product. ShipFast does not pretend to be that.

## Auth and payments, honestly

ShipFast uses NextAuth with Google and magic links. Fine for most indie SaaS. Nuxt Beyond uses nuxt-auth-utils: Google OAuth and email/password. Also fine for most indie SaaS.

Neither is Supastarter. No 2FA, no passkeys, no RBAC in either of these two. If your buyers are enterprise IT, you are not choosing between ShipFast and Nuxt Beyond. You are looking at [Supastarter vs Nuxt Beyond](/blog/supastarter-vs-nuxtbeyond) and probably paying for Better Auth.

Payments: ShipFast has Stripe and Lemon Squeezy. Nuxt Beyond has Stripe and Polar, switchable with an env var. Polar is a merchant of record, which matters if you do not want to become a VAT hobbyist. I compared the two in [Stripe vs Polar](/blog/stripe-vs-polar-which-to-choose). Webhook wiring, customer portal, plan limits: [Stripe subscriptions in Nuxt 4](/blog/stripe-subscriptions-nuxt-4).

If you specifically need Lemon Squeezy, ShipFast has it. If you specifically need Polar, Nuxt Beyond has it. Most people need Stripe and will not notice the rest.

## Price

| | ShipFast | Nuxt Beyond |
|---|----------|-------------|
| **Entry** | $199 Starter | $59 boilerplate |
| **Top kit** | $249 All-in / $299 with CodeFast | $89 bundle (boilerplate + distribution framework) |
| **Updates** | Lifetime | Lifetime |
| **Projects** | Unlimited | Unlimited |

$59 vs $199 is $140. $59 vs $249 is $190. Both are one-time.

ShipFast’s price is the tax on community and brand. Some people on Reddit call it overpriced because free Next.js starters exist. That is true and incomplete. You are paying for a known path and a Discord, not for a unique architecture.

Nuxt Beyond is cheaper because it is newer and narrower. You are paying for the AI and Cloudflare work, not for 8,100 people who can unblock you on Saturday night.

See [current pricing](/#pricing).

## When to choose ShipFast

Pick ShipFast if:

- You write React and you want to stay there
- You want the biggest boilerplate community, not the deepest AI stack
- The product is a classic SaaS (directory, waitlist, course, analytics, simple B2C)
- You are fine adding your own model calls later, or you do not need them
- You want Vercel + Mongo or Supabase and you already know that setup
- Social proof on the landing page ("used by thousands") helps you sleep

Do not pick ShipFast if you have already decided on Vue/Nuxt. There is no Nuxt edition. You would be buying a stack change, not a shortcut.

## When to choose Nuxt Beyond

Pick Nuxt Beyond if:

- You want Nuxt 4 / Vue 3, not Next.js
- The product needs RAG, document Q&A, or a knowledge-base chatbot
- You want to sell an embeddable widget, not only a logged-in app
- You want DALL-E / Sora without wiring a second product
- You want Cloudflare D1 + R2 + Workers as the default, not an afterthought
- $59 is the budget and you still need payments, auth, and multi-tenancy

Do not pick Nuxt Beyond if you need 2FA, passkeys, i18n on day one, or a giant Discord. Those gaps are real. Also do not pick it if your team only hires React.

## What I would do

If a React founder asked "which boilerplate?" with no other context, I would say ShipFast. The community is the feature. Thousands of people have shipped on it. That is hard to fake.

If they said "I am building an AI chatbot" or "customers need a script tag on their site" or "I want Nuxt," I would say Nuxt Beyond, and I would not hedge. ShipFast will not grow a RAG pipeline because you bought the All-in plan.

They are not really substitutes. ShipFast is the default Next.js indie kit. Nuxt Beyond is an AI-first Nuxt 4 boilerplate. The search query puts them in one ring. The products you would actually ship with them do not overlap that much.

If you are still deciding among Nuxt kits only, start with the [best Nuxt boilerplates compared](/blog/best-nuxt-boilerplates-compared) post, then come back here only if ShipFast is still in the tab.

---

*I am the founder of Nuxt Beyond. Features and prices are as of September 2026. If ShipFast has shipped AI or changed pricing, [tell me on X](https://x.com/Raress96_) and I will update this.*
