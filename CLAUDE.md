# CLAUDE.md

This file provides guidance to Claude Code when working with the NuxtBeyond boilerplate.

## Project Overview

NuxtBeyond is an AI-first Nuxt 4 boilerplate for building SaaS products. It includes:
- AI chat with RAG (Cloudflare AI Search + Vercel AI SDK v6)
- Authentication (Google OAuth + credentials)
- Billing with subscriptions (Stripe or Polar, selectable via `PAYMENT_PROVIDER`)
- Embeddable widget system
- Multi-tenant projects

## Tech Stack

- **Framework:** Nuxt 4, Vue 3, TypeScript
- **UI:** Nuxt UI v4, Tailwind CSS
- **Database:** Cloudflare D1 (SQLite) with Drizzle ORM
- **Storage:** Cloudflare R2 via NuxtHub
- **AI:** Vercel AI SDK v6, OpenAI GPT via Cloudflare AI Gateway, Cloudflare AI Search
- **Auth:** nuxt-auth-utils (Google OAuth + credentials)
- **Payments:** Stripe or Polar (subscriptions, webhooks) — selectable via `PAYMENT_PROVIDER`
- **Email:** Resend
- **Deployment:** NuxtHub → Cloudflare Workers

## Development Commands

**Package Manager**: This project uses `npm`.

```bash
npm run dev          # Start development server with local resources (http://localhost:3000)
npm run dev:remote   # Start development server with remote Cloudflare bindings
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint with auto-fix
npm run typecheck    # TypeScript type checking
npm run db:generate  # Generate Drizzle migrations
npx nuxthub deploy   # Deploy to Cloudflare
```

**Remote Development Mode:**
Use `npm run dev:remote` when:
- Testing AI Search (AutoRAG) - requires real R2 buckets linked to AI Search instance
- Testing with production-like data
- Debugging Cloudflare-specific issues

Configure remote resource IDs in `wrangler.jsonc` under `env.remote` section.

> **Critical:** AI Search MUST use remote mode. Files stored locally are inaccessible to AI Search.

## MCP Server Usage

This project uses Model Context Protocol (MCP) servers for enhanced development assistance:

### Nuxt UI MCP Server

For Nuxt UI v4 component documentation and usage:

```bash
# Check Nuxt UI v4 component documentation
# Use the claude-code-guide agent with questions about:
# - UFileUpload component
# - UButton, UInput, UTextarea components
# - Component props, events, and styling
# Example: "How do I use UFileUpload for file uploads with drag/drop?"
```

**When to use:**
- Looking up Nuxt UI v4 component API documentation
- Understanding component props and events
- Checking component styling options
- Verifying correct component usage patterns

**Important notes:**
- Refer to https://ui.nuxt.com/docs for official Nuxt UI v4 documentation
- Check existing components in `app/components/` for implementation patterns
- Use semantic colors (primary, secondary, success, etc.) instead of Tailwind classes

### Nuxt MCP Server

For Nuxt framework documentation and features:

```bash
# Check Nuxt framework documentation
# Use for questions about:
# - Nuxt composables (useFetch, useAsyncData, navigateTo)
# - File-based routing and middleware
# - Server API routes and utilities
# - Nuxt modules and configuration
```

**When to use:**
- Understanding Nuxt composables and utilities
- Learning about file-based routing conventions
- Checking server API route patterns
- Verifying Nuxt configuration options

## Project Structure

```
├── app/
│   ├── components/      # Vue components
│   ├── composables/     # Vue composables
│   ├── layouts/         # Page layouts (default, dashboard, auth)
│   ├── middleware/      # Route middleware (authenticated, not-authenticated)
│   └── pages/           # File-based routing
├── content/             # Nuxt Content (blog, landing page YAML)
├── server/
│   ├── api/             # API endpoints
│   │   ├── projects/    # Project CRUD, knowledge base, billing, questions, members
│   │   ├── embed/       # Embeddable widget APIs
│   │   ├── security/    # Auth (login, register, password reset)
│   │   └── webhooks/    # Stripe webhook handler
│   ├── db/              # Drizzle schema and queries
│   ├── middleware/      # Server middleware (embed-auth)
│   ├── routes/          # Server routes (OAuth, file serving, invitations)
│   └── utils/           # Server utilities (auth, billing, resend, cloudflare)
├── shared/              # Shared types and constants
│   ├── types.d.ts       # TypeScript interfaces
│   ├── auth.d.ts        # Session type augmentation
│   └── constants.ts     # Plan limits and configuration
└── public/              # Static assets (embed.js, images)
```

## Database Schema

Located in `server/db/schema.ts`:

| Table | Purpose |
|-------|---------|
| `users` | User accounts (email, password, OAuth) |
| `projects` | Project/tenant configuration and billing |
| `projectMembers` | User-project relationships with roles |
| `invitations` | Team invitation management |
| `chats` | Chat sessions |
| `messages` | Chat messages with AI parts |
| `questions` | Human support escalation tickets |
| `questionReplies` | Support conversation threading |

## Key Files

| File | Purpose |
|------|---------|
| `server/db/schema.ts` | Drizzle ORM database schema |
| `server/db/queries.ts` | Common database query functions |
| `shared/constants.ts` | Plan limits (PLANS_CONSTANTS) |
| `shared/types.d.ts` | Shared TypeScript interfaces (ProjectConfiguration) |
| `server/utils/auth.ts` | Authentication helpers |
| `server/utils/billing.ts` | Billing validation utilities |
| `server/utils/ai.ts` | AI security functions (prompt injection protection) |
| `server/utils/resend.ts` | Email sending functions |
| `server/utils/cloudflare.ts` | AutoRAG API client |
| `public/embed.js` | Embeddable widget script |

## Authentication

Uses `nuxt-auth-utils` for session management:

```typescript
// Client-side
const { loggedIn, user, session } = useUserSession()

// Protect pages
definePageMeta({ middleware: 'authenticated' })

// Server-side
const { user } = await requireUserSession(event)
```

**Auth endpoints:**
- `POST /api/security/register` - Email registration with verification
- `POST /api/security/login` - Credentials login
- `GET /routes/auth/google` - Google OAuth callback
- `POST /api/security/forgot-password` - Password reset request
- `POST /api/security/reset-password` - Password reset confirmation

## Member Management

Multi-tenant project system with role-based access control:

### Roles

- **Admin**: Full project access (configuration, billing, member management)
- **Member**: Limited access (knowledge base, view members)

### Team Invitation Workflow

1. Admin invites user via email from Members page
2. System sends invitation email with accept/decline buttons
3. User clicks accept → redirects to login/signup with `redirect` parameter
4. After authentication → redirects to invitation acceptance route
5. Invitation accepted → user added to project with specified role
6. User redirected to project dashboard

### API Endpoints

**Member Management:**
- `GET /api/projects/[id]/members` - List project members with roles
- `POST /api/projects/[id]/members/invite` - Send invitation email
- `DELETE /api/projects/[id]/members/[userId]` - Remove member (admin only, prevents last admin removal)

**Invitation Management:**
- `GET /server/routes/invitations/accept` - Accept invitation (server route for full page reload)
- `POST /server/routes/invitations/decline` - Decline invitation

**Protected Routes:**
- Basic Setup configuration - Admin only
- Project Customization - Admin only
- Billing page - Admin only
- Knowledge Base - All roles
- Members page - All roles (view only for members)

### Permission Enforcement

Three-layer security:
1. **UI Layer**: Menu items and buttons hidden based on role
2. **Page Layer**: Redirects in page components for unauthorized access
3. **API Layer**: Role validation in server endpoints

### Database Schema

**projectMembers** table:
- `id` - Primary key
- `projectId` - Foreign key to projects
- `userId` - Foreign key to users
- `role` - Enum: 'admin' | 'member'
- `createdAt` - Timestamp

**invitations** table:
- `id` - Primary key
- `projectId` - Foreign key to projects
- `email` - Invitee email
- `role` - Intended role for invitee
- `invitedBy` - Foreign key to users (inviter)
- `token` - Unique invitation token
- `status` - Enum: 'pending' | 'accepted' | 'declined'
- `expiresAt` - Expiration timestamp
- `createdAt` - Timestamp

### Email Functions

From `server/utils/resend.ts`:
- `sendInvitationEmail()` - Send project invitation with accept/decline buttons
- `sendMemberRemovedEmail()` - Notify removed member
- `sendMemberAddedEmail()` - Notify new member after acceptance

## AI Integration

Uses Vercel AI SDK v6 with OpenAI GPT via Cloudflare AI Gateway:

```typescript
// Stream AI response with tools
return streamText({
  model: aiGateway([openai('gpt-5.1-chat-latest')]), // via Cloudflare AI Gateway
  messages,
  tools: {
    getInformation,       // Search knowledge base via Cloudflare AI Search
    contactHumanSupport,  // Escalate to human support
  }
})
```

**Key endpoints:**
- `POST /api/embed/chats` - Create new chat
- `POST /api/embed/chats/[id]` - Send message, stream AI response
- `GET /api/embed/[id]` - Get project config for widget

**AI Search Requirements:**
The `getInformation` tool uses Cloudflare AI Search (AutoRAG) which requires R2 buckets. When developing:
- Use `npm run dev:remote` to test AI Search functionality
- Local file storage (default dev mode) is not accessible to AI Search
- R2 bucket must be linked to your AI Search instance in Cloudflare dashboard

### Video Generation

The `/videos` demo uses Google Gemini Omni Flash through the Interactions API with plain `fetch` (`server/utils/gemini.ts`). Model and defaults (aspect ratio, resolution, duration) live in `VIDEO_GENERATION` in `shared/constants.ts`.

- `POST /api/videos` and `POST /api/videos/[id]` start a background interaction (`background: true`) and store its id in `videoChatMessages.jobId` with status `processing`
- `GET /api/videos/[id]/poll` checks the interaction and saves the finished MP4 to blob storage
- Follow-up prompts edit the chat's latest finished video via `previous_interaction_id`
- Without `GEMINI_API_KEY`, the generation endpoints return 503 and the page shows the error as a toast

### Prompt Injection Protection

The boilerplate includes basic protection against prompt injection attacks in `server/utils/ai.ts`:

**Protection Functions:**
- `sanitizeCustomPrompt()` - Sanitizes admin-configured prompts (project description, custom prompts) at save time
- `validateUserMessage()` - Validates user messages for suspicious patterns
- `sanitizeAIResponse()` - Strips leaked system instructions from AI responses

**Where Applied:**
- `POST /api/projects` - Sanitizes description when creating projects
- `PUT /api/projects/[id]` - Sanitizes description when updating basic settings
- `PATCH /api/projects/[id]` - Sanitizes custom prompts in chat configuration
- `POST /api/embed/chats/[id]` - Validates user messages before processing

**Important:** These protections catch 95%+ of casual jailbreak attempts but **are not foolproof**. Perfect prompt injection protection is impossible - even major AI companies struggle with this. The current implementation provides reasonable baseline protection that can be extended based on security requirements. See README.md for detailed limitations and recommendations.

## Billing (Stripe or Polar)

Per-project subscriptions with webhooks. Two payment providers are supported and the active one is selected with the `PAYMENT_PROVIDER` env var (`stripe` is the default).

### Provider switch

- `PAYMENT_PROVIDER=stripe | polar` → surfaced as `runtimeConfig.public.paymentProvider` (so both server and `billing.vue` read it).
- `server/utils/billing/provider.ts` exposes `getPaymentProvider(event)` which returns the active provider behind a common `PaymentProvider` interface (`createCheckout`, `createPortalSession`).
- Implementations: `server/utils/billing/stripe.ts` and `server/utils/billing/polar.ts` (Polar SDK client in `server/utils/polar.ts`).
- The HTTP endpoints are provider-neutral; only the webhook path differs per provider (signatures differ).

**API endpoints (provider-neutral):**
- `POST /api/projects/[id]/billing` - Create checkout session
- `POST /api/projects/[id]/billing/portal` - Customer portal session

### Webhooks

The webhook path is provider-specific because each provider signs payloads differently. Only the active provider's webhook needs to be configured.

**Stripe** (`/api/webhooks/stripe`) — events handled:
- `checkout.session.completed` - Initial subscription
- `customer.subscription.updated` - Plan changes, cancellation
- `customer.subscription.deleted` - Subscription ended
- `customer.subscription.trial_will_end` - Trial ending notification

To make it work:
1. In the Stripe Dashboard → Developers → Webhooks, add an endpoint `https://<your-domain>/api/webhooks/stripe`.
2. Subscribe to the four events above.
3. Copy the endpoint's **signing secret** into `STRIPE_WEBHOOK_SECRET`.
4. For local testing, use the Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` (use the secret it prints).

**Polar** (`/api/webhooks/polar`) — events handled (signature verified via the auto-imported `Webhooks()` helper from `@polar-sh/nuxt`):
- `subscription.created` - Initial subscription
- `subscription.updated` - Plan changes, cancellation/reactivation, status changes
- `subscription.revoked` - Subscription ended

To make it work:
1. In the Polar Dashboard → Settings → Webhooks, add an endpoint `https://<your-domain>/api/webhooks/polar`.
2. Subscribe to `subscription.created`, `subscription.updated`, `subscription.revoked`.
3. Copy the endpoint's **signing secret** into `POLAR_WEBHOOK_SECRET`.
4. For local testing, tunnel localhost (cloudflared/ngrok) and register the public URL as the endpoint.

### Polar access token permissions

Create an **Organization Access Token** (Polar Dashboard → Settings → API) with the scopes the code actually calls:
- `products:read` - resolve plan → product at checkout (`polar.products.list`)
- `checkouts:write` - create checkout sessions (`polar.checkouts.create`)
- `customer_sessions:write` - create the customer portal session (`polar.customerSessions.create`)

Set the token as `POLAR_ACCESS_TOKEN`, and `POLAR_MODE=sandbox | production` to match where the token/products live.

### Plan → product mapping

Both providers map a plan to its product/price using the plan's `planName` (from `planNames` in `shared/constants.ts`). **Only monthly prices are supported by default.**

- **Stripe:** resolved by **price lookup key** `${planName}_monthly` (e.g. `pro_monthly`). Create each Stripe price with that lookup key. The webhook reverse-maps via the price's `lookup_key` (`planName = lookup_key.split('_')[0]`).
- **Polar:** resolved by **product metadata** `planName` (e.g. a product with metadata `{ planName: "pro" }`). Looked up at checkout via `polar.products.list({ isArchived: false, metadata: { planName } })`; the webhook reverse-maps via `subscription.product.metadata.planName`.

> To add yearly billing, extend the lookup key / metadata to carry the period (e.g. `${planName}_yearly` for Stripe, a `planFrequency` metadata field for Polar) and pass the chosen period through the checkout call. See the `TODO: Add support for yearly prices` markers in `server/utils/billing/`.

### DB columns (`projects` table)

- Stripe: `stripeCustomerId`, `stripeSubscriptionId`, `stripeCurrentPeriodEnd`
- Polar: `polarCustomerId`, `polarSubscriptionId`, `polarCurrentPeriodEnd`

**Plan configuration** in `shared/constants.ts`:
```typescript
export const PLANS_CONSTANTS = {
  free: { DOCUMENTS: 5, MAX_FILE_SIZE: 0.1, AI_REPLIES: 200, ... },
  pro: { DOCUMENTS: 20, MAX_FILE_SIZE: 1, AI_REPLIES: 2000, ... },
  advanced: { DOCUMENTS: 50, MAX_FILE_SIZE: 2, AI_REPLIES: 5000, ... },
}
```

## Email System

All emails sent via `server/utils/resend.ts`:

- `sendPasswordResetEmail()` - Password reset link
- `sendVerificationEmail()` - Email verification
- `sendInvitationEmail()` - Project invitation with accept/decline buttons
- `sendMemberRemovedEmail()` - Member removal notification
- `sendMemberAddedEmail()` - New member welcome email
- `sendNewSupportQuestionEmail()` - Support escalation notification
- `sendSupportAnswerEmail()` - Customer answer notification
- `sendFeedbackEmail()` - User feedback

**IMPORTANT:** Never send emails directly from API routes. Always use these exported functions.

## Embeddable Widget

Iframe-based widget loaded from `/embed` route:

1. **Embed script** (`public/embed.js`) - Creates bubble button and iframe
2. **Embed page** (`app/pages/embed.vue`) - Renders chat interface
3. **Domain validation** - Server validates against project's allowed domains

**Configuration via `window.__nuxtbeyond_config`:**
```javascript
window.__nuxtbeyond_config = {
  projectId: 'xxx',
  primaryColor: '#0d9488',
  position: 'bottom-right',
  logo: '/path/to/logo.png'
}
```

## Blog System

The boilerplate includes a blog powered by Nuxt Content:

- **Blog pages**: `app/pages/blog/index.vue` (list) and `app/pages/blog/[slug].vue` (detail)
- **Sample posts**: `content/blog/` contains 2 sample markdown posts:
  - `how-to-choose-the-best-ai-chatbot-platform.md`
  - `how-to-create-a-chatbot.md`
- **Blog metadata**: `content/blog.yml` defines title and description
- **Blog configuration**: `content.config.ts` configures Nuxt Content

Users should customize or remove the sample blog posts before deploying. The blog is automatically available at `/blog` route.

## Pricing Tiers

Plan configurations are defined in:
- **Feature limits**: `shared/constants.ts` - PLANS_CONSTANTS object (documents, AI replies, file sizes, feature flags)
- **Pricing & UI**: `content/index.yml` - pricing section (prices, descriptions, features list)

## Common Customizations

### Change branding
- Update `app/assets/css/main.css` colors
- Update `shared/constants.ts` `THEME_PRIMARY_COLOR` variable
- Update `content/index.yml` for landing page
- Replace assets in `public/images/`

### Modify plans
- Edit `shared/constants.ts` (PLANS_CONSTANTS)
- Update `content/index.yml` pricing section (each plan needs a `planName` field matching `planNames`)
- Map the plan to a provider product (monthly only by default):
  - **Stripe:** create a price with lookup key `{planName}_monthly`
  - **Polar:** create a product with metadata `{ planName }`

### Add new API endpoints
- Create file in `server/api/` following Nuxt convention
- Use `requireUserSession()` for protected routes
- Use `useDrizzle()` for database access

### Customize AI behavior
- Edit system prompt in `server/api/embed/chats/[id].post.ts`
- Add/modify tools in the same file
- Adjust AutoRAG query parameters in `server/utils/cloudflare.ts`

## Environment Variables

### Local Development

Copy `.env.example` to `.env` and fill in your values.

### Cloudflare Deployment

Variables must be set in **two places** in the Cloudflare dashboard:

**Build-Time Variables** (Settings > Builds and deployments > Environment variables):
Required for SSR, prerendering, sitemap generation, and SEO:
- `NUXT_SITE_URL` - Site URL for Nuxt SEO
- `NUXT_SITE_ENV` - Environment type (optional)
- `NUXT_PUBLIC_SITE_URL` - Public site URL
- `PAYMENT_PROVIDER` - Active payment provider: `stripe` (default) or `polar`
- `NUXT_PUBLIC_STRIPE_KEY` - Stripe publishable key (only if `PAYMENT_PROVIDER=stripe`)
- `NUXT_PUBLIC_TURNSTILE_SITE_KEY` - Turnstile site key

**Runtime Variables** (Settings > Variables and Secrets):
All build-time variables plus:
- `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_AI_GATEWAY_ID`, `CLOUDFLARE_AUTO_RAG_ID`
- `NUXT_OAUTH_GOOGLE_CLIENT_ID`, `RESEND_AUDIENCE_ID`
- `STRIPE_PROMO_CODE` (Stripe only), `POLAR_MODE` (Polar only: `sandbox` | `production`)

**Runtime Secrets** (Settings > Variables and Secrets > Type: Secret):
- `NUXT_SESSION_PASSWORD`, `NUXT_OAUTH_GOOGLE_CLIENT_SECRET`
- `NUXT_STRIPE_KEY`, `STRIPE_WEBHOOK_SECRET` (Stripe only)
- `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET` (Polar only)
- `RESEND_API_KEY`, `CLOUDFLARE_AUTO_RAG_API_TOKEN`, `NUXT_TURNSTILE_SECRET_KEY`
- `GEMINI_API_KEY` (optional, video generation)

> **Important:** Use `NUXT_` prefix for automatic runtime config injection. The `wrangler.jsonc` has `keep_vars: true` to preserve dashboard variables during deployment.

See `wrangler.jsonc` comments and `README.md` for complete list.

# Styling

Accent color: #0d9488

# Important Instructions

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.

# Code Writing Recommendations

- NEVER add comments unless explicitly requested by the user
- Variable and function names should be self-explanatory
- Avoid obvious comments like "// Reactive state", "// Handle form submission", etc.
- ALWAYS use multi-line format for if statements, never single-line:
  - ❌ Bad: `if (projects.value.length === 0) return null;`
  - ✅ Good: `if (projects.value.length === 0) {\n    return null;\n  }`
- ALWAYS add an empty line at the end of files

## Nuxt UI v4 Color Guidelines

**ALWAYS use Nuxt UI v4 semantic colors instead of Tailwind color classes:**

**✅ CORRECT - Use semantic colors:**
- `text-primary` - Main brand color, important links
- `text-secondary` - Secondary actions, complementary elements
- `text-neutral` - General text, borders, backgrounds
- `text-success` - Success messages, completed states
- `text-info` - Info alerts, help text, neutral notifications
- `text-warning` - Warning messages, pending states
- `text-error` - Error messages, validation errors

**❌ WRONG - Don't use Tailwind color classes:**
- `text-gray-600`, `text-gray-700`, `text-gray-800` etc.
- `text-blue-500`, `text-green-600`, `text-red-500` etc.
- `bg-gray-50`, `border-gray-200` etc.

**Available semantic colors in Nuxt UI v4:**
- `primary` (default: #0d9488 - cyan) - Main CTAs, active navigation, brand elements
- `secondary` (default: blue) - Secondary buttons, alternative actions
- `success` (default: green) - Success messages, positive confirmations
- `info` (default: blue) - Info alerts, tooltips, help text
- `warning` (default: yellow) - Warning messages, attention-needed items
- `error` (default: red) - Error messages, destructive actions
- `neutral` (default: slate) - Text, borders, backgrounds, disabled states

## References

- Nuxt UI v4 docs: https://ui4.nuxt.com/docs/components
- Vercel AI SDK: https://ai-sdk.dev/docs/introduction
- Drizzle ORM: https://orm.drizzle.team/docs/overview
- NuxtHub: https://hub.nuxt.com/docs
