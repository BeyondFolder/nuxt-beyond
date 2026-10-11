---
title: 'Best Nuxt 4 Boilerplates for SaaS Compared (2026)'
description: 'Updated October 2026 comparison of Nuxt 4 SaaS boilerplates: Supastarter, SuperSaas, ShipAhead, NuxtBase, Nuxflare Pro, and Nuxt Beyond. Prices, AI, and who each one is for.'
seo:
  title: 'Best Nuxt 4 SaaS Boilerplates Compared (2026)'
  description: 'Honest 2026 comparison of Nuxt 4 SaaS boilerplates. Supastarter, SuperSaas, ShipAhead, NuxtBase, Nuxflare Pro, Nuxt Beyond. Current prices, RAG, auth, and which to pick.'
image:
  src: /images/homepage/demo2.png
authors:
  - name: Rares
    to: https://x.com/Raress96_
    avatar:
      src: /images/avatar.png
date: 2026-10-03
badge:
  label: Comparison
---

I'm the founder of Nuxt Beyond, so this is not a neutral review. I will still tell you when another kit is the better buy, because for a lot of Nuxt SaaS it is.

I first published this in March 2026. Half the prices in that version are now wrong. NuxtBase is no longer a free admin template. ShipAhead cut its list price. Nuxflare Pro showed up with a Cloudflare RAG demo. And I used to write "the only Nuxt boilerplate with production RAG." That line is stale. This rewrite is the October 2026 version.

Prices and feature lists below were checked on each product's own site on 2026-10-03.

## The boilerplates

Every paid Nuxt SaaS kit I could find that still has a live site:

- **[Supastarter](https://supastarter.dev/)** ($299 Solo) - the most established option, Nuxt plus Next.js plus TanStack Start
- **[SuperSaas](https://supersaas.dev/)** ($149) - Nuxt 4 base with Better Auth and demo apps
- **[ShipAhead](https://shipahe.ad/)** ($99 promo / $199 list) - Nuxt 4 with OpenRouter chat and image gen
- **[NuxtBase](https://nuxtbase.com/)** ($299 Solo / $599 Team) - Nuxt 4, Stripe, Better Auth, AI chat credits
- **[Nuxflare Pro](https://saas-boilerplate.dev/)** ($99 early bird / $149 listed) - Nuxt on Cloudflare, including a RAG chatbot demo
- **Nuxt Beyond** (one-time [launch price](/#pricing)) - AI-first: Cloudflare AI Search, embeddable widget. That's mine.

I'm also including **[ShipFast](https://shipfa.st/)** ($199 Starter / $249 All-in) because it shows up in every boilerplate search, even though it is Next.js.

The official [Nuxt UI SaaS template](https://saas-template.nuxt.dev/) is free and UI-only. Fine as a landing-page start. It is not a SaaS backend.

NuxifySaaS did not resolve last time I checked it. Nuxt Starter AI's own site was unreachable, and Nuxt 3 lost maintenance on 2026-07-31, so I left both out.

## Feature comparison

| Feature | Nuxt Beyond | Supastarter | SuperSaas | ShipAhead | NuxtBase | Nuxflare Pro |
|---------|-------------|-------------|-----------|-----------|----------|--------------|
| **Price (one-time)** | [Launch price](/#pricing) | $299 / $799 / $1,499 | $149 ($199 all-access) | $99 promo / $199 list | $299 / $599 | $99 early bird / $149 |
| **Framework** | Nuxt 4 | Nuxt 4, Next.js, TanStack Start | Nuxt 4 | Nuxt 4 | Nuxt 4 | Nuxt |
| **AI chat** | Vercel AI SDK v6, streaming | AI workflows / chatbot examples | Demo app | OpenRouter chat, text, image | Streaming chat + org credits | RAG chatbot demo, image gen demo |
| **RAG / document search** | Cloudflare AI Search (formerly AutoRAG), per-project knowledge | Not listed as product RAG | Not listed | Not listed | Not listed | Listed as an AI demo on Vectorize |
| **Embeddable chat widget** | Yes (script tag, domain checks) | No | No | Support widgets, not a third-party AI embed | No | No |
| **Auth** | Google OAuth + email/password | Passkeys, 2FA, OAuth, magic links, roles | Better Auth: passkeys, 2FA, 30+ social | Email, magic links, Google, admin | Better Auth: passkeys, TOTP, magic links, orgs | Teams + RBAC |
| **Payments** | Stripe or Polar | Stripe, Polar, Lemon Squeezy, Creem, Dodo | Stripe | Stripe, Polar, Dodo | Stripe (Polar for their own checkout) | Stripe and Paddle |
| **Database** | Cloudflare D1 + Drizzle | Any SQL (Prisma/Drizzle) | Turso default; Postgres, SQLite, NuxtHub | Postgres (Supabase / Neon) + Drizzle | Drizzle | D1, plus Postgres option |
| **Deploy** | Cloudflare Workers | Vercel / Docker | Multiple | Vercel or Cloudflare Workers | Not Cloudflare-first on the homepage | Cloudflare-native (also AWS/Vercel/Netlify listed) |
| **i18n** | No | Yes | No | Yes | No | Yes |
| **Social proof** | 2 sales | 1,500 developers | 280+ customers / 300+ developers | 95+ makers | Not listed as a buyer count | Early access; testimonials marked as previews |

Sources, all checked 2026-10-03: [supastarter.dev](https://supastarter.dev/), [supersaas.dev](https://supersaas.dev/), [shipahe.ad](https://shipahe.ad/), [nuxtbase.com](https://nuxtbase.com/), [saas-boilerplate.dev](https://saas-boilerplate.dev/), [nuxtbeyond.com](https://nuxtbeyond.com/).

## How I would actually choose

Ignore brand for a second. Ask what the first paid product is.

**You need passkeys, 2FA, i18n, and five payment providers.** Buy [Supastarter](https://supastarter.dev/). I would. The $299 is real money, and you are buying the boring enterprise surface, not a chatbot.

**You want a classic Nuxt 4 SaaS shell, Postgres, i18n, and model-switchable chat/image gen.** Buy [ShipAhead](https://shipahe.ad/) while the $99 promo is still up (1 of 100 left on 2026-10-03). Head-to-head: [ShipAhead vs Nuxt Beyond](/blog/shipahead-vs-nuxtbeyond).

**You want Better Auth, flexible deploys, and you are not building document Q&A.** [SuperSaas](https://supersaas.dev/) at $149 is the value pick. Their AI chat is a demo module next to a URL shortener. That is fine if AI is a sidebar.

**You want Nuxt 4 + Stripe + org credits for AI chat, and you will wire RAG yourself.** [NuxtBase](https://nuxtbase.com/) at $299. Deeper auth than I ship. No embeddable widget.

**You want Durable Objects, Queues, Vectorize, teams and RBAC on Cloudflare.** [Nuxflare Pro](https://saas-boilerplate.dev/). They list a RAG chatbot as a demo. If your architecture is "Cloudflare everything, including queues," they are closer than I am.

**The product is RAG over customer documents, or a chatbot you paste onto someone else's site.** That is the job Nuxt Beyond is built for. [Pricing](/#pricing).

**You write React and you want a crowd.** [ShipFast](https://shipfa.st/). Not Nuxt. Full writeup: [ShipFast vs Nuxt Beyond](/blog/shipfast-vs-nuxtbeyond).

## Each boilerplate, honestly

### Supastarter - best for teams and agencies

> Longer version: [Supastarter vs Nuxt Beyond](/blog/supastarter-vs-nuxtbeyond).

**Price:** $299 Solo / $799 Startup / $1,499 Agency, one-time ([supastarter.dev](https://supastarter.dev/), 2026-10-03). They also sell a $149 "book a call" consult. 1,500 developers on the homepage.

Supastarter is still the grown-up kit. Nuxt, Next.js, and TanStack Start from one vendor. Auth is the feature: passwords, passkeys, magic links, OAuth, 2FA, roles. Payments are Stripe, Polar, Lemon Squeezy, Creem, Dodo. i18n is a real architecture, not a `locales/` folder you promise to fill in later.

**Where it wins:** auth depth, payment-provider count, docs, i18n, "my agency will not get fired for this."

**Where it falls short:** $299 is several times Nuxt Beyond's launch price. AI is workflows and chatbot examples, not a multi-tenant knowledge base with an embed script. If you are buying it for RAG, you are buying the wrong row.

**Pick Supastarter if** you are a team or an agency and the checklist is compliance-shaped. Do not pick it to save money. You will not.

### SuperSaas - best value for a non-RAG SaaS

**Price:** $149 Essentials, $199 All Access with PocketVue and Nuxtra ([supersaas.dev](https://supersaas.dev/), 2026-10-03). 280+ customers on the hero, 300+ developers in the social section.

Better Auth is the reason people buy this: passkeys, 2FA, 30+ social providers, impersonation in the admin. Database is a menu (Turso default, Postgres, SQLite). Deploy is not locked to one cloud. The demo repo is how they teach the stack: AI chat, posts, tasks, URL shortener, file manager.

**Where it wins:** $149, auth, flexible DB/deploy, a codebase you can learn by reading the demos.

**Where it falls short:** that AI chat is listed with the other demos. It is not a RAG pipeline. Extra payment providers beyond Stripe were still not the headline. No third-party embeddable AI widget.

**Pick SuperSaas if** you are shipping a normal SaaS (billing, users, admin) and you might add a model call later. If the product *is* the chatbot, keep scrolling.

### ShipAhead - best middle ground with AI chat

**Price:** $199 list, $99 with "$100 off for the first 100 customers," 1 left on 2026-10-03 ([shipahe.ad](https://shipahe.ad/)). They also show ShipAhead Pro at $29/month. 95+ makers.

ShipAhead is the other Nuxt 4 kit that actually puts AI on the landing page: chat, text generation, image generation through OpenRouter, swap models without rewriting the app. Around that: magic links, Stripe / Polar / Dodo, Postgres, i18n, PWA, cron, admin, Nuxt Content blog.

**Where it wins:** fuller SaaS shell than mine, Postgres if you already think in SQL, i18n, more payment providers, OpenRouter so you are not glued to one vendor.

**Where it falls short:** no RAG listed. The "widget" on the page is live chat / feedback for *your* users, not a script tag you sell to other sites. Multi-tenancy is lighter than project-scoped knowledge bases.

**Pick ShipAhead if** you want Vue, a classic SaaS, and "add chat in an afternoon." Pick something else if the product is document Q&A. Details: [ShipAhead vs Nuxt Beyond](/blog/shipahead-vs-nuxtbeyond).

### NuxtBase - no longer the free starter

**Price:** $299 Solo / $599 Team, one-time ([nuxtbase.com](https://nuxtbase.com/), 2026-10-03). Checkout goes through Polar. I cannot find a buyer count on the homepage.

In March I described NuxtBase as free / $199 with no payments and no AI. That page is gone. Today they list Nuxt 4, Better Auth, Stripe, Drizzle, Nuxt UI, Nuxt Content, organizations, admin, streaming AI chat, usage tracking, and per-organization credit limits.

**Where it wins:** auth (passkeys, TOTP, magic links, orgs) is deeper than Nuxt Beyond. Stripe is in the product, not a "you build it" gap. Credit limits are a real SaaS problem if you resell tokens.

**Where it falls short:** $299. No RAG listed. No embeddable widget. You are paying team-kit money for a strong generic SaaS, not for document search.

**Pick NuxtBase if** you want Better Auth + Stripe + AI allowances and you will add retrieval yourself. Do not pick it because you remember the free tier. That version is not what they sell now.

### Nuxflare Pro - Cloudflare-heavy, RAG as a demo

**Price:** early-bird $99, $149 after launch. The same homepage also has a "$149" primary CTA ([saas-boilerplate.dev](https://saas-boilerplate.dev/), 2026-10-03). Treat $99 as the promo and $149 as the listed price.

This is the kit that killed my "only RAG" line. They list Cloudflare D1, R2, KV, Vectorize, Durable Objects, Queues, cron, Stripe and Paddle, teams, RBAC, i18n, and "AI features (RAG chatbot, image generation)" under AI demos.

**Where it wins:** if you want Workers primitives I do not ship (Durable Objects, Queues), plus teams and RBAC. Cloudflare-native the way I am, with a wider platform surface.

**Where it falls short:** RAG is on the demo list, not described as multi-tenant knowledge bases with an embeddable widget. Early-access social proof; some testimonials on the page are marked as previews. I have not bought the repo, so I am judging the public page, not the code.

**Pick Nuxflare Pro if** the architecture is Cloudflare platform (queues, websockets, Vectorize) and you want RBAC. Pick Nuxt Beyond if the product you sell is "paste this chat on your docs site."

### Nuxt Beyond - best when the product is RAG or a widget

**Price:** one-time [launch price](/#pricing), lifetime updates. Bundle with the distribution framework is $89. Price rises $10 every 5 sales ([nuxtbeyond.com](https://nuxtbeyond.com/)).

I built this because I kept rewiring auth, Stripe, and retrieval for AI chat products. The core is Cloudflare AI Search (formerly AutoRAG) over per-project files, streaming chat, and a one-line embed with domain validation. Stripe or Polar via an env var. Google OAuth and email/password. D1, R2, KV, Workers.

How the RAG path is wired: [How to build an AI chatbot with RAG in Nuxt 4](/blog/how-to-build-ai-chatbot-with-rag-nuxt-4). How the embed works: [Embeddable chat widget in Nuxt 4](/blog/embeddable-chat-widget-nuxt-4). Edge deploy: [Multi-tenant SaaS on Cloudflare Workers](/blog/multi-tenant-saas-cloudflare-workers-nuxt-4).

**Where it wins:**
- Retrieval is in the product, scoped per project, not a todo-app demo
- Embeddable widget you can sell as chatbot-as-a-service
- Prompt-injection protection is listed; I have not seen that on the other homepages
- Lowest paid price in this table at launch pricing

**Where it falls short (I'll be blunt):**
- Auth is basic. No 2FA, no passkeys, no RBAC. SuperSaas, Supastarter, and NuxtBase all beat me here.
- No i18n. Supastarter, ShipAhead, and Nuxflare have it.
- Two sales. That is not a community. ShipFast has 8,429 makers. I will not dress it up.
- Docs are thinner than Supastarter.
- Image and video generation in the repo sat on OpenAI APIs that OpenAI retired. Do not buy this kit for DALL-E or Sora. They are gone.
- Deploy is `wrangler` / Workers CI. NuxtHub's one-command deploy was retired on 2026-01-31.

**Pick Nuxt Beyond if** you are building document chat, a helpdesk bot over your files, or a widget other companies put on their sites. Do not pick it for enterprise auth, i18n, or "I want the biggest Discord."

Payments context if you are choosing Stripe vs a merchant of record: [Stripe vs Polar](/blog/stripe-vs-polar-which-to-choose).

### ShipFast - best community, wrong framework if you want Nuxt

**Price:** $199 Starter / $249 All-in / $299 with CodeFast. $100 off the first 8,440 customers, 11 left, 8,429 makers ([shipfa.st](https://shipfa.st/), 2026-10-03). Discord listed at 5,000+ on the Premium plan.

ShipFast is Next.js. Auth, Stripe, Lemon Squeezy, blog, emails, MongoDB or Supabase, Vercel. No built-in RAG. No multi-tenancy. The page still sells ChatGPT prompts for terms and privacy, not a chat product.

**Pick ShipFast if** you are a React founder and community is the feature. **Do not pick it** if you have already decided on Vue. There is no Nuxt edition. Longer version: [ShipFast vs Nuxt Beyond](/blog/shipfast-vs-nuxtbeyond).

## What changed since March 2026

I am leaving this here so you can see why old comparison posts rot:

| Kit | March 2026 in this post | 2026-10-03 |
|-----|-------------------------|------------|
| Supastarter Solo | $349 | $299 |
| ShipAhead | $149 (up from ~$99) | $99 promo / $199 list, 1 promo slot left |
| NuxtBase | Free / $199, no Stripe, no AI | $299 / $599, Stripe, AI chat credits |
| Nuxflare Pro | Not in the table | $99 / $149, RAG chatbot demo |
| Nuxt Beyond RAG claim | "the only Nuxt boilerplate with production RAG" | False as a uniqueness claim; Nuxflare lists RAG |
| SuperSaas | $149, 300+ developers | $149, 280+ customers / 300+ developers |
| ShipFast | $199-249, 8,100+ users | $199 / $249 / $299, 8,429 makers |

If you bookmarked the March version, throw the prices out.

## Which one should you pick?

**Building RAG chat, knowledge bases, or an embeddable AI widget?** Nuxt Beyond is the kit I would use for that job, because that is the job I built it for. Nuxflare is the other Cloudflare+RAG name to open in a second tab. [See pricing](/#pricing).

**Building a traditional SaaS with enterprise-shaped auth?** Supastarter at $299.

**Building a non-AI (or lightly-AI) SaaS on a budget?** SuperSaas at $149.

**Want AI chat and image gen on Postgres, plus i18n?** ShipAhead at $99 while the promo lasts.

**Want Nuxt 4, Stripe, Better Auth, and AI credit limits?** NuxtBase at $299.

**Want Durable Objects, Queues, Vectorize, RBAC?** Nuxflare Pro.

**Want React and a huge Discord?** ShipFast. Then stop reading Nuxt roundups.

There is no "best Nuxt 4 boilerplate." There is a best one for the product you are shipping next. If the product is a chatbot other people embed, I think I am the fit. If the product is a multi-language B2B app with passkeys, I am not, and you should pay Supastarter or NuxtBase and not feel bad about it.

---

*Last updated 2026-10-03. Prices and feature lists taken from each vendor's homepage that day. If something moved, [DM me on X](https://x.com/Raress96_) and I will fix it.*
