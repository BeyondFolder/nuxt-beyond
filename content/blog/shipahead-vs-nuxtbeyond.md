---
title: 'ShipAhead vs Nuxt Beyond: Which AI SaaS Boilerplate?'
description: 'An honest comparison of ShipAhead ($99 Nuxt 4 kit with OpenRouter AI) and Nuxt Beyond (RAG chat and an embeddable widget on Cloudflare). Features, stack, price, and when to pick each.'
seo:
  title: 'ShipAhead vs Nuxt Beyond: AI SaaS Boilerplate Comparison (2026)'
  description: 'ShipAhead vs Nuxt Beyond in 2026. Both are Nuxt 4 AI kits: OpenRouter chat and Postgres vs Cloudflare RAG and an embeddable widget. Prices and which one fits.'
image:
  src: /images/homepage/demo2.png
authors:
  - name: Rares Serban
    to: /about
    avatar:
      src: /images/rares-serban.jpg
date: 2026-09-26
updatedAt: 2026-11-11
badge:
  label: Comparison
---

I built Nuxt Beyond, so this is not a neutral review. I will still tell you when ShipAhead is the better buy, because for a lot of Nuxt products it is.

ShipAhead is the other Nuxt 4 kit that actually ships AI, not a chatbot demo buried next to a todo app. Tom Han built it. The landing page says 95+ makers. If you want Vue, payments, and "add AI chat in minutes," you will land on [shipahe.ad](https://shipahe.ad/) and on this site in the same afternoon.

I already covered the wider field (Supastarter, Supersaas, NuxtBase, ShipFast) in the [Nuxt 4 boilerplate comparison](/blog/best-nuxt-boilerplates-compared). This post is the head-to-head: ShipAhead vs Nuxt Beyond.

Prices and feature lists below were checked on each product's own site on 2026-09-26.

## The short version

**ShipAhead** is a Nuxt 4 SaaS kit: auth (including magic links), Stripe / Polar / Dodo, Postgres (Supabase or Neon) with Drizzle, i18n, PWA, cron, an admin panel, a blog, and AI chat plus text and image generation through OpenRouter. It is $99 right now ($199 list, $100 off for the first 100 customers, 4 left on 2026-09-26). It does not list RAG or an embeddable chat widget.

**Nuxt Beyond** is a Nuxt 4 kit built around AI products: Cloudflare AI Search (formerly AutoRAG), streaming chat, an embeddable widget, Stripe or Polar, and project-based workspaces on Cloudflare Workers + D1. It is free and open source under the MIT License. Auth is basic. There is no i18n, no PWA, no cron UI. The community is tiny.

Pick ShipAhead if you want a classic Nuxt SaaS shell, Postgres, i18n, and model-switchable chat/image gen. Pick Nuxt Beyond if the product is document Q&A or a chatbot you paste onto someone else's site.

## Feature comparison

| Feature | ShipAhead ($99 promo / $199 list) | Nuxt Beyond (free, MIT) |
|---------|-----------------------------------|-------------------|
| **Framework** | Nuxt 4 (Vue 3) | Nuxt 4 (Vue 3) |
| **AI chat** | Yes (OpenRouter, switch GPT model) | Vercel AI SDK v6, streaming, tool calling |
| **RAG / semantic search** | Not listed | Cloudflare AI Search (formerly AutoRAG) |
| **Image generation** | Yes (OpenRouter) | Yes (OpenAI gpt-image-2.6-flare) |
| **Embeddable widget** | Not listed | One-line script, domain validation |
| **Prompt injection protection** | Not listed | Yes |
| **Auth** | Email/password, magic links, Google, admin area | Google OAuth + email/password |
| **Payments** | Stripe, Polar, Dodo | Stripe + Polar |
| **Multi-tenancy** | Organizations/projects show up in the DB demo | Project-based workspaces, RAG scoped per project |
| **Database** | PostgreSQL (Supabase / Neon) + Drizzle | Cloudflare D1 + Drizzle |
| **Deployment** | Vercel or Cloudflare Workers | Cloudflare Workers |
| **i18n** | Yes | No |
| **PWA / cron / admin** | Yes | No dedicated PWA, cron UI, or admin panel |
| **Blog** | Nuxt Content | Nuxt Content |
| **File storage** | S3-compatible (R2 logo also on the page) | Cloudflare R2 |
| **Community** | 95+ makers, Discord | Small (launched January 2026, now open source) |
| **Refunds** | None | None by default; case by case if you DM me on X |

ShipAhead source: [shipahe.ad](https://shipahe.ad/) (checked 2026-09-26). Nuxt Beyond: [nuxtbeyond.com](https://nuxtbeyond.com/) (checked 2026-09-26).

## Where ShipAhead wins

I am not going to pretend a newer kit with a tiny community beats a $99 kit with 95+ buyers on "feels safe to pick."

### It is a fuller SaaS shell

ShipAhead's page is a checklist of the boring product: magic links, an admin area, cron jobs, PWA, analytics, legal page templates, customer-support widgets, language switching. That is a lot of tickets you will not file in week one.

Nuxt Beyond has auth, Stripe/Polar, a blog, Resend, and projects. It does not have i18n. It does not have a PWA toggle. It does not have a cron UI. If your launch list is "signup in French, installable on a phone, nightly report email," ShipAhead is already closer.

### Postgres

ShipAhead points at PostgreSQL, Supabase, and Neon. If you already think in SQL joins, row-level security, and a hosted Postgres dashboard, that is a real preference, not a fashion take.

Nuxt Beyond uses Cloudflare D1 (SQLite at the edge) and Drizzle. Fine for a lot of SaaS. Not fine if you know you need Postgres on day one. I wrote the deploy side of that tradeoff in [Deploying a multi-tenant SaaS to Cloudflare Workers](/blog/multi-tenant-saas-cloudflare-workers-nuxt-4).

### More ways to get paid

Stripe, Polar, and Dodo. Nuxt Beyond has Stripe and Polar, switched with an env var. Polar as merchant of record is the same idea on both. Dodo is extra on their side.

If you want the payment-provider comparison without the rest of this post: [Stripe vs Polar](/blog/stripe-vs-polar-which-to-choose). Webhook wiring in Nuxt 4: [Stripe subscriptions in Nuxt 4](/blog/stripe-subscriptions-nuxt-4).

### Magic links and an admin area

ShipAhead lists magic links, social logins, password recovery, protected pages, and an admin area. Nuxt Beyond is Google OAuth and email/password via nuxt-auth-utils. No 2FA, no passkeys, no magic links.

If your users will fight you over "I don't want another password," magic links matter. I did not build them.

### Social proof

95+ makers and a Discord vs a tiny community. I will not dress that up. ShipAhead has been through more other people's apps. Bug reports exist in a channel you can join. Nuxt Beyond is me, the public repo, and updates I actually use on my own products.

### AI coding agents are table stakes

Both kits sell an agent-ready codebase. ShipAhead has AGENTS.md. Nuxt Beyond has CLAUDE.md. In 2026 that is not a reason to pick either one. Every paid Nuxt kit now claims it.

## The AI split is the actual decision

Both sites say "AI." They do not mean the same work.

ShipAhead's AI block is: add AI chat, text generation, or image creation; switch GPT model anytime; OpenRouter is in the stack. That is the right shape if you want a chat box and a "generate an image" button, and you want to swap models without rewriting providers.

A `fetch` to a chat API is an afternoon. OpenRouter makes that afternoon shorter. I am not going to pretend I invented streaming.

What I kept rebuilding, and why I extracted Nuxt Beyond, is the other pile: documents go in, embeddings happen, answers come back from *that* tenant's files, streaming works, the model has tools so "hi" does not hit the vector index, and a script tag on a customer site does not let a random domain burn your credits.

That path is Cloudflare AI Search (formerly AutoRAG) plus Vercel AI SDK v6. One AI Search instance, results filtered by folder so tenant A does not see tenant B's PDF:

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

`rewrite_query` turns "how much is it" into a search for pricing. `score_threshold` drops junk chunks. The folder range is tenant isolation without a vector database per customer.

ShipAhead's public page does not list RAG, embeddings, or document search. If they have shipped it since 2026-09-26, [tell me on X](https://x.com/raress96) and I will update this.

Nuxflare Pro does list a RAG chatbot demo on Cloudflare Vectorize. So "Nuxt Beyond is the only Nuxt kit with RAG" is false. What I will say is: RAG is the product in this repo, not a demo app next to notes and a URL shortener. Full walkthrough: [How to build an AI chatbot with RAG in Nuxt 4](/blog/how-to-build-ai-chatbot-with-rag-nuxt-4).

Image generation: ShipAhead has it via OpenRouter. Nuxt Beyond has it too, on OpenAI's gpt-image-2.6-flare since November 2026. That's also when I moved video from Sora, which OpenAI retired, to Google Gemini Omni Flash.

## Database and hosting

ShipAhead: Postgres + Drizzle, deploy to Vercel or Cloudflare Workers, S3-compatible uploads (Cloudflare R2 is on the logos too). You can stay in the Vercel + Supabase world a lot of people already know, or you can put the app on Workers.

Nuxt Beyond wants one vendor for compute, database, files, rate limits, and retrieval: Workers, D1, R2, KV, AI Gateway, AI Search. Cold starts and the bill at 10k users look different from Vercel + Postgres + a separate vector store + OpenAI.

If you already pay for Supabase and like the dashboard, ShipAhead will feel like home. If you want the database next to the Worker that served the request, and RAG without standing up Pinecone, that is the point of Nuxt Beyond.

I am not going to tell you SQLite is as good as Postgres for every app. Heavy reporting, PostGIS, a team that already runs Supabase: pick the Postgres kit.

## The widget, and what "multi-tenant" means

ShipAhead's database demo shows `users`, `subscriptions`, `organizations`, and `projects`. I have not bought the repo, so I will not describe their tenancy model as if I had. The marketing page does not sell an embeddable chatbot for third-party sites.

Nuxt Beyond models a customer as a project: members, billing, chats, and files under `projects/{id}/`. The RAG filter above uses the same id.

The embeddable widget is the other business-model difference. A bubble on someone else's site:

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

The script is the easy part. The rest is iframe isolation, Safari and third-party cookies, a domain allowlist so random sites cannot burn your credits, and KV rate limits. That work is in the repo. Walkthrough: [How to build an embeddable chat widget in Nuxt 4](/blog/embeddable-chat-widget-nuxt-4).

If you are building chatbot-as-a-service, this is the product. ShipAhead is not selling that, at least not on the page I checked.

ShipAhead does list "customer support" as live chat or feedback widgets to help *your* users. That is you supporting your SaaS. It is not you selling a branded chat bubble to *their* customers.

## Auth, honestly

Neither of us is Supastarter. No 2FA, no passkeys, no RBAC comparison that ends with Nuxt Beyond winning. If your buyer is enterprise IT, read [Supastarter vs Nuxt Beyond](/blog/supastarter-vs-nuxtbeyond) and budget for Better Auth.

Between these two: ShipAhead has the longer auth list (magic links, admin). Nuxt Beyond has Google + password. For a lot of indie tools either is enough. For "I need magic links this week," ShipAhead.

## Price

| | ShipAhead | Nuxt Beyond |
|---|-----------|-------------|
| **Entry** | $99 promo ($199 list). $100 off for the first 100 customers, 4 left on 2026-09-26. | Free (MIT License) |
| **Bundle** | Not listed as a second SKU | None, one free repo |
| **Updates** | Lifetime | Public GitHub repo |
| **Projects** | Unlimited | Any, under MIT |
| **Refunds** | No | Not applicable (free) |

Sources: [ShipAhead pricing](https://shipahe.ad/) (checked 2026-09-26) and the [Nuxt Beyond GitHub repo](https://github.com/BeyondFolder/nuxt-beyond).

ShipAhead is a one-time payment. Nuxt Beyond is free and open source.

ShipAhead's $99 is a first-100 discount. If you like the kit, the promo ending is a reason to buy it, not a reason to skip the comparison.

Nuxt Beyond is free and open source, and it is newer and narrower. You get the RAG and widget work, not 95 people who can unblock you in Discord.

## When to choose ShipAhead

Pick ShipAhead if:

- You want Nuxt 4 and a classic SaaS checklist (i18n, PWA, cron, admin, magic links)
- You want Postgres (Supabase or Neon), not D1
- AI means chat, text, and image gen with model switching, not document Q&A
- You care that 95+ people already bought it
- You want Stripe, Polar, *and* Dodo
- $99 (or $199 later) is fine and you want the bigger kit

Do not pick ShipAhead if the product is "upload PDFs, answer from them" or "paste a script tag on the customer's site." Their public page does not list that work.

## When to choose Nuxt Beyond

Pick Nuxt Beyond if:

- The product needs RAG, document Q&A, or a knowledge-base chatbot
- You want to sell an embeddable widget, not only a logged-in app
- You want Cloudflare D1 + R2 + Workers + AI Search as the default
- The budget is tight and you still need auth, Stripe or Polar, and project workspaces
- You already write Vue/Nuxt and you do not need i18n on day one

Do not pick Nuxt Beyond if you need magic links, 2FA, passkeys, i18n, a PWA, a cron UI, or a busy Discord. Those gaps are real.

If the team only hires React, neither of these is the conversation. That one is [ShipFast vs Nuxt Beyond](/blog/shipfast-vs-nuxtbeyond).

## What I would do

If a Nuxt founder said "I need a SaaS starter with some AI chat" and they already like Postgres, I would say ShipAhead. The kit is broader. The community is larger. OpenRouter chat and image gen are what they actually advertise.

If they said "customers upload docs and ask questions" or "I need a script tag on their marketing site," I would say Nuxt Beyond, and I would not hedge. You can add a chat route to any boilerplate. You cannot add tenant-filtered retrieval, ingestion, and a third-party embed in a weekend without being angry at yourself.

They overlap on Nuxt 4, Stripe, Polar, Drizzle, and "AI" on the landing page. The products you would actually ship with them do not overlap that much.

If you are still shopping the whole Nuxt field, start with [best Nuxt 4 boilerplates compared](/blog/best-nuxt-boilerplates-compared), then come back here only if ShipAhead is still in the tab.

Nuxt Beyond is free and open source. Get it on [GitHub](https://github.com/BeyondFolder/nuxt-beyond).

---

*I am the founder of Nuxt Beyond. Features and prices checked 2026-09-26 against [shipahe.ad](https://shipahe.ad/) and [nuxtbeyond.com](https://nuxtbeyond.com/). If ShipAhead has shipped RAG, a third-party embed, or new pricing, [tell me on X](https://x.com/raress96) and I will update this.*
