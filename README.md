# NuxtBeyond

An AI-first Nuxt 4 boilerplate for building SaaS products. Open source under the MIT License.

[![Nuxt](https://img.shields.io/badge/Made%20with-Nuxt%204-00DC82?labelColor=020420)](https://nuxt.com)
[![Nuxt UI](https://img.shields.io/badge/Nuxt%20UI-v4-70EBE6?labelColor=020420)](https://ui.nuxt.com)
[![AI SDK](https://img.shields.io/badge/AI%20SDK-v6-70EBE6?labelColor=020420)](https://ai-sdk.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-0d9488?labelColor=020420)](./LICENSE)

## Features

**AI**
- AI chat with RAG over your own documents, powered by Cloudflare AutoRAG (AI Search)
- Vercel AI SDK v6 with streaming responses and tool calling (knowledge base search, human support escalation)
- Embeddable chat widget: one script tag, iframe-isolated, with domain allowlists
- Extra demo pages for user chat, image generation, and video generation

**Auth**
- Google OAuth and email/password login via `nuxt-auth-utils`
- Email verification and password reset
- Cloudflare Turnstile on public forms, KV-backed rate limiting

**Billing**
- Stripe or Polar, selected with the `PAYMENT_PROVIDER` env var (Stripe by default)
- Per-project subscriptions with webhooks, a customer portal, and plan gating from `shared/constants.ts`

**SaaS foundations**
- Multi-tenant projects with admin/member roles and email team invitations
- Transactional emails with Resend
- Nuxt Content landing page, blog, and starter legal pages

**Infrastructure and UI**
- NuxtHub on Cloudflare: D1 (SQLite via Drizzle ORM), R2 blob storage, KV
- Nuxt UI v4 with dark mode

## Quick start

Requirements: Node.js version from [`.nvmrc`](./.nvmrc) and npm.

```bash
git clone https://github.com/BeyondFolder/nuxt-beyond.git
cd nuxt-beyond
nvm use            # optional, picks the Node version from .nvmrc
npm ci             # or: npm install
cp .env.example .env
npm run dev        # http://localhost:3000
```

`npm run dev` uses local emulation of D1, R2, and KV. To test the knowledge base search (AutoRAG), run `npm run dev:remote` instead: AI Search only reads files from a real R2 bucket linked to your AI Search instance, so locally stored files are not searchable. Remote resource IDs live under `env.remote` in `wrangler.jsonc`.

## Environment variables

Every variable is listed with a placeholder in [`.env.example`](./.env.example). Copy it to `.env` and fill in what you need. Never commit `.env`.

| Group | Variables |
|-------|-----------|
| Site | `NUXT_SITE_URL`, `NUXT_PUBLIC_SITE_URL`, `NUXT_SITE_ENV` (optional) |
| Auth | `NUXT_SESSION_PASSWORD` (32+ chars), `NUXT_OAUTH_GOOGLE_CLIENT_ID`, `NUXT_OAUTH_GOOGLE_CLIENT_SECRET` |
| Email (Resend) | `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`, `NO_REPLY_EMAIL`, `SUPPORT_EMAIL` |
| Cloudflare and AI | `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_AI_GATEWAY_ID`, `CLOUDFLARE_AUTO_RAG_ID`, `CLOUDFLARE_AUTO_RAG_API_TOKEN`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` (optional) |
| Billing switch | `PAYMENT_PROVIDER` = `stripe` or `polar` |
| Stripe | `NUXT_STRIPE_KEY`, `NUXT_PUBLIC_STRIPE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PROMO_CODE` (optional) |
| Polar | `POLAR_MODE` (`sandbox` or `production`), `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET` |
| Turnstile | `NUXT_PUBLIC_TURNSTILE_SITE_KEY`, `NUXT_TURNSTILE_SECRET_KEY` |

Only the active payment provider needs its keys.

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Dev server with local Cloudflare emulation |
| `npm run dev:remote` | Dev server bound to remote Cloudflare resources (needed for AutoRAG) |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | Type checking with `nuxt typecheck` (vue-tsc) |
| `npm run lint` | ESLint with auto-fix (`npm run lint:ci` runs without fixing, as in CI) |
| `npm run db:generate` | Generate Drizzle migrations from `server/db/schema.ts` |
| `npm run deploy` | Deploy the built app to Cloudflare Workers with Wrangler |

## Make it yours

Before deploying, replace the sample branding and placeholders:

- **`wrangler.jsonc`**: set your app name, domain routes, R2 bucket name, D1 database ID, and KV namespace ID (placeholders like `your-app-name`, `your-domain.com`, `your-d1-database-id`, `your-kv-namespace-id`). Do the same in the `env.remote` block.
- **Plans and pricing**: limits live in `shared/constants.ts` (`PLANS_CONSTANTS`), prices and copy in the `pricing` section of `content/index.yml`. Each plan needs a `planName` that matches `planNames`.
- **Landing page and blog**: `content/index.yml`, `content/blog.yml`, and the sample posts in `content/blog/`.
- **Legal pages**: `content/pages/terms-of-service.yml` and `content/pages/privacy-policy.yml` are starter templates with `[Your Company]` style placeholders. Fill them in and get them reviewed before going live.
- **Embed widget**: `public/embed.js` and `app/utils/embedCode.ts` use `nuxtbeyond` names and `https://nuxtbeyond.com` URLs. Replace them with your own names and domain.
- **Other branding**: `public/llms.txt`, images in `public/images/`, the primary color in `app/assets/css/main.css` and `THEME_PRIMARY_COLOR` in `shared/constants.ts`. Run `grep -rn nuxtbeyond app public content` to find what is left.

## Billing (Stripe or Polar)

Set `PAYMENT_PROVIDER=stripe` (default) or `PAYMENT_PROVIDER=polar`. Checkout and portal endpoints are provider-neutral (`server/utils/billing/provider.ts`); only the webhook differs. Plans map to provider products by `planName`, and only monthly prices are supported by default. The billing page promotes a 7-day trial on Pro. With Stripe the app sets it at checkout (`server/utils/billing/stripe.ts`); with Polar you set it on the product in the Polar dashboard.

**Stripe**
1. Create a monthly price for each paid plan with the lookup key `{planName}_monthly` (for example `pro_monthly`).
2. Add a webhook endpoint at `https://<your-domain>/api/webhooks/stripe` for `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, and `customer.subscription.trial_will_end`.
3. Put its signing secret in `STRIPE_WEBHOOK_SECRET`. For local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

**Polar**
1. Create a product for each paid plan with the metadata field `planName` (for example `pro`), and give the Pro product a 7-day free trial.
2. Create an Organization Access Token with `products:read`, `checkouts:write`, and `customer_sessions:write`, and set it as `POLAR_ACCESS_TOKEN`.
3. Add a webhook endpoint at `https://<your-domain>/api/webhooks/polar` for `subscription.created`, `subscription.updated`, and `subscription.revoked`, and put its secret in `POLAR_WEBHOOK_SECRET`.

To add yearly billing, look for the `TODO: Add support for yearly prices` markers in `server/utils/billing/`.

## Deploy to Cloudflare Workers

1. Create the D1 database, R2 bucket, and KV namespace in Cloudflare and put their names and IDs in `wrangler.jsonc`.
2. Set environment variables in the Cloudflare dashboard under **Workers & Pages > your project > Settings**:
   - **Build variables** (Builds and deployments > Environment variables): `NUXT_SITE_URL`, `NUXT_PUBLIC_SITE_URL`, `NUXT_SITE_ENV`, `PAYMENT_PROVIDER`, `NUXT_PUBLIC_STRIPE_KEY`, `NUXT_PUBLIC_TURNSTILE_SITE_KEY`, `NO_REPLY_EMAIL`, `SUPPORT_EMAIL`. These are needed for SSR, prerendering, and SEO.
   - **Runtime variables and secrets** (Variables and Secrets): all build variables again, plus the rest of `.env.example`. Store keys, tokens, and passwords as type **Secret**.
3. Build and deploy, either through Cloudflare's Git integration or from your machine:

```bash
npm run build
npm run deploy
```

`wrangler.jsonc` sets `keep_vars: true`, so variables set in the dashboard are preserved across deploys. The comments at the bottom of that file list which variables go where.

## Security notes

- `server/utils/ai.ts` adds baseline prompt injection protection: admin prompts are sanitized on save, user messages are checked for suspicious patterns, and leaked system instructions are stripped from responses. It catches common jailbreak attempts but is not foolproof, so monitor chat logs and add layers that fit your risk level.
- When a project lists allowed domains, the embed widget only works on those domains. An empty list allows any site, so set it before sharing your embed code.

## Project structure

```
app/          Nuxt app: pages, components, layouts, composables, middleware
content/      Nuxt Content: landing page, blog, legal pages
server/
  api/        API routes (projects, embed, security, webhooks, ...)
  db/         Drizzle schema, queries, migrations
  routes/     OAuth callbacks, file serving, invitations, email verification
  utils/      Auth, billing providers, email, AI, Cloudflare helpers
shared/       Types and plan constants shared by app and server
public/       Static assets and the widget script (embed.js)
```

[`CLAUDE.md`](./CLAUDE.md) has more detailed architecture notes (schema, roles, endpoints) and works as context for AI coding tools. For AI-assisted development, the [Nuxt MCP](https://nuxt.com/docs/4.x/guide/ai/mcp) and [Nuxt UI MCP](https://ui.nuxt.com/docs/getting-started/ai/mcp) servers are worth adding.

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE) © Rareș Serban

Made by [@raress96](https://x.com/raress96).
