# NuxtBeyond

The AI-first Nuxt 4 boilerplate for building SaaS products. Ship in days, not months.

[![Nuxt](https://img.shields.io/badge/Made%20with-Nuxt%204-00DC82?labelColor=020420)](https://nuxt.com)
[![Nuxt UI](https://img.shields.io/badge/Nuxt%20UI-v4-70EBE6?labelColor=020420)](https://ui.nuxt.com)
[![AI SDK](https://img.shields.io/badge/AI%20SDK-v6-70EBE6?labelColor=020420)](https://ai-sdk.dev/)

## Features

### 🤖 AI & Chat
- **AI Chat with RAG** - Vercel AI SDK v6 with streaming responses
- **Cloudflare AutoRAG** - Semantic search over uploaded documents
- **Tool Calling** - AI can search knowledge base and escalate to humans
- **Embeddable Widget** - One-line embed script for any website

### 🔐 Authentication
- **Google OAuth** - One-click social login
- **Email/Password** - Traditional credentials auth
- **Email Verification** - Secure account activation
- **Password Reset** - Forgot password flow with email

### 💳 Payments
- **Stripe Subscriptions** - Recurring billing with webhooks
- **Customer Portal** - Self-service billing management
- **Plan Gating** - Feature access based on subscription tier
- **Free Trials** - Configurable trial periods

### ☁️ Infrastructure
- **NuxtHub** - Zero-config Cloudflare deployment
- **D1 Database** - SQLite at the edge with Drizzle ORM
- **R2 Storage** - File uploads and blob storage
- **KV Store** - Key-value data for caching

### 🎨 UI/UX
- **Nuxt UI v4** - Beautiful, accessible components
- **Dark Mode** - Full light/dark theme support
- **Responsive** - Mobile-first design
- **Semantic Colors** - Consistent design system

## Quick Start

```bash
# Clone the repository
git clone https://github.com/nuxtbeyond/nuxt-beyond.git
cd nuxt-beyond

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server (local resources)
npm run dev

# Or use remote Cloudflare resources (required for AI Search testing)
npm run dev:remote
```

> **Note:** To test AI Search (AutoRAG), you must use `npm run dev:remote` because AI Search requires real R2 buckets. Configure your resource IDs in `wrangler.jsonc` under the `env.remote` section.

### AI-assisted development

To make developing with Nuxt and Nuxt UI easier, you should add their MCP servers to your tool of choice (Claude Code, Cursor, Antigravity etc).
Follow the links for instructions:
- https://nuxt.com/docs/4.x/guide/ai/mcp
- https://ui.nuxt.com/docs/getting-started/ai/mcp

## Initial Customization

Before deploying, customize these files for your project:

### 1. Update `public/llms.txt`

The `public/llms.txt` file helps language models understand your project structure. You must update it with your project information:

1. Replace `nuxtbeyond.com` with your domain
2. Replace `NuxtBeyond` with your project name
3. Update the project description to match your application
4. Customize the features list to reflect your specific implementation

This file is served at `/.well-known/llms.txt` and used by AI models when analyzing your project.

### 2. Update `wrangler.jsonc`

See the [Wrangler Configuration](#wrangler-configuration) section below for required changes before deployment.

### 3. Update Blog Content

The boilerplate includes a blog system using Nuxt Content with 2 sample blog posts in `content/blog/`:

- `how-to-choose-the-best-ai-chatbot-platform.md`
- `how-to-create-a-chatbot.md`

Before deploying:

1. **Update blog metadata** in `content/blog.yml`:
   - Change `title` to your blog name
   - Update `description` to match your content

2. **Customize or remove sample posts:**
   - Delete the sample `.md` files if you don't need them
   - Add your own blog posts using the same frontmatter structure
   - Or remove the blog entirely by deleting `app/pages/blog/` and `content/blog/`

The blog is automatically available at `/blog` and includes SEO-optimized pages.

### 4. Update `public/embed.js`

See the [Important: Update Widget Script Before Use](#important-update-widget-script-before-use) section under Embeddable Widget for branding customizations.

## Environment Variables

### Local Development

Copy `.env.example` to `.env` and fill in your values.

### Cloudflare Deployment

When deploying to Cloudflare Workers, set environment variables in **Cloudflare Dashboard > Workers & Pages > your-project > Settings**:

#### Build-Time Variables
Set in **Settings > Builds and deployments > Environment variables** (required for SSR, prerendering, and SEO):

| Variable | Build | Runtime | Type | Description |
|----------|-------|---------|------|-------------|
| `NUXT_SITE_URL` | ✅ | ✅ | Variable | Your site URL (e.g., https://yourdomain.com) - used by Nuxt SEO |
| `NUXT_SITE_ENV` | ✅ | ✅ | Variable | Environment type (production, staging, etc.) - optional |
| `NUXT_PUBLIC_SITE_URL` | ✅ | ✅ | Variable | Your site URL - used in runtime config |
| `NUXT_PUBLIC_STRIPE_KEY` | ✅ | ✅ | Variable | Stripe publishable key |
| `NUXT_PUBLIC_TURNSTILE_SITE_KEY` | ✅ | ✅ | Variable | Cloudflare Turnstile site key |
| `NO_REPLY_EMAIL` | ✅ | ✅ | Variable | Your no-reply email address for system emails |
| `SUPPORT_EMAIL` | ✅ | ✅ | Variable | Your support email address for feedback |

#### Runtime-Only Variables
Set in **Settings > Variables and Secrets**:

| Variable | Build | Runtime | Type | Description |
|----------|-------|---------|------|-------------|
| `CLOUDFLARE_ACCOUNT_ID` | - | ✅ | Variable | Your Cloudflare account ID |
| `CLOUDFLARE_AI_GATEWAY_ID` | - | ✅ | Variable | AI Gateway ID for OpenAI proxy |
| `CLOUDFLARE_AUTO_RAG_ID` | - | ✅ | Variable | AI Search (AutoRAG) ID for knowledge base |
| `NUXT_OAUTH_GOOGLE_CLIENT_ID` | - | ✅ | Variable | Google OAuth client ID |
| `RESEND_AUDIENCE_ID` | - | ✅ | Variable | Resend audience ID for email lists |
| `STRIPE_PROMO_CODE` | - | ✅ | Variable | Stripe promo code ID (optional) |
| `NUXT_SESSION_PASSWORD` | - | ✅ | Secret | Session encryption key (32+ chars) |
| `NUXT_OAUTH_GOOGLE_CLIENT_SECRET` | - | ✅ | Secret | Google OAuth secret |
| `NUXT_STRIPE_KEY` | - | ✅ | Secret | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | - | ✅ | Secret | Stripe webhook signing secret |
| `RESEND_API_KEY` | - | ✅ | Secret | Resend email API key |
| `CLOUDFLARE_AUTO_RAG_API_TOKEN` | - | ✅ | Secret | AutoRAG API token |
| `NUXT_TURNSTILE_SECRET_KEY` | - | ✅ | Secret | Turnstile secret key |

> **Note:** Build-time variables must be set in BOTH locations. The `wrangler.jsonc` file has `keep_vars: true` to preserve dashboard variables during deployment.

### Wrangler Configuration

Before deploying, customize `wrangler.jsonc` for your Cloudflare account:

**Required Changes:**

1. **App Name** (line 3): Replace `your-app-name` with your app name
2. **Domain Routes** (lines 9-12): Update `your-domain.com` with your domain
3. **R2 Bucket** (line 61): Change bucket name from `your-app-bucket`
4. **D1 Database ID** (line 72): Replace placeholder UUID with your D1 database ID (from Cloudflare dashboard)
5. **KV Namespace ID** (line 79): Replace placeholder with your KV namespace ID (from Cloudflare dashboard)

**Example:**
```jsonc
{
  "name": "my-saas-app",  // Your app name
  "routes": [
    { "pattern": "my-domain.com", "zone_name": "my-domain.com" },
    { "pattern": "www.my-domain.com", "zone_name": "my-domain.com" }
  ],
  "r2_buckets": [
    { "binding": "BLOB", "bucket_name": "my-saas-app" }
  ],
  "d1_databases": [
    { "binding": "DB", "database_id": "your-actual-database-id" }
  ],
  "kv_namespaces": [
    { "binding": "KV", "id": "your-actual-kv-id" }
  ]
}
```

Get your database and KV IDs from the Cloudflare dashboard under **Workers & Pages > D1** and **Workers & Pages > KV** respectively.

## Project Structure

```
├── app/
│   ├── components/     # Vue components
│   ├── composables/    # Vue composables
│   ├── layouts/        # Page layouts (default, dashboard, auth)
│   ├── middleware/     # Route middleware (auth guards)
│   └── pages/          # File-based routing
├── content/            # Nuxt Content (blog, landing page)
├── server/
│   ├── api/            # API endpoints
│   │   ├── projects/   # Project management
│   │   ├── embed/      # Embeddable widget
│   │   ├── security/   # Auth endpoints
│   │   └── webhooks/   # Stripe webhooks
│   ├── db/             # Database schema & queries
│   ├── middleware/     # Server middleware
│   ├── routes/         # Server routes (OAuth, files)
│   └── utils/          # Server utilities
├── shared/             # Shared types & constants
└── public/             # Static assets
```

## Key Files

| File | Purpose |
|------|---------|
| `server/db/schema.ts` | Database schema (Drizzle ORM) |
| `server/api/projects/` | Project/tenant management APIs |
| `server/api/embed/` | Embeddable widget APIs |
| `server/utils/resend.ts` | Email sending functions |
| `server/utils/auth.ts` | Authentication helpers |
| `shared/constants.ts` | Plan limits & configuration |

## Rate Limiting

Built-in rate limiting protects API endpoints from abuse using Cloudflare KV:

```typescript
// Example: Add rate limiting to any endpoint
const rateLimit = await checkRateLimit(event, {
  maxRequests: 5,        // Maximum requests allowed
  windowMs: 60 * 1000,   // Time window in milliseconds (1 minute)
  keyPrefix: 'my-endpoint', // Unique identifier for this endpoint
});

if (!rateLimit.allowed) {
  throw createError({
    statusCode: 429,
    statusMessage: 'Too many requests',
  });
}
```

**Default rate limits:**
- **Login**: 5 attempts per 15 minutes per IP
- **Registration**: 3 attempts per 15 minutes per IP
- **Embed chat creation**: 5 sessions per 10 minutes per IP
- **Embed chat messages**: 10 messages per 2 minutes per IP

Rate limiting is based on IP address (respects X-Forwarded-For header) and uses Cloudflare KV for state storage.

## Multi-Tenant Architecture

NuxtBeyond uses **projects as the primary tenant boundary** for multi-tenant SaaS applications. Each project is an isolated workspace with its own configuration, billing, and team members.

### Project-Based Resources

The following resources are **linked to projects** (multi-tenant ready):

| Resource | Table | Purpose |
|----------|-------|---------|
| **Chats** | `chats` | Embeddable widget chat sessions |
| **Messages** | `messages` | Chat conversation history |
| **Questions** | `questions` | Human support escalation tickets |
| **Knowledge Base** | AI Search (R2) | RAG documents and files |
| **Project Members** | `projectMembers` | Team access control |

### User-Based Resources

The following resources are currently **linked to users** (not projects):

- `userChats` - General user chat sessions
- `imageChats` - Image generation conversations
- `videoChats` - Video-related conversations

These are designed for single-user features but can be converted to project-based if you need multi-tenant support for these features.

### Converting User Resources to Project-Based

If you want to make `userChats`, `imageChats`, or `videoChats` multi-tenant, follow these steps:

**1. Update the schema** (`server/db/schema.ts`):

```typescript
// Example: Converting userChats to project-based
export const userChats = sqliteTable('user_chats', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }), // Add this
  title: text('title'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
```

**2. Update relations**:

```typescript
export const userChatsRelations = relations(userChats, ({ one }) => ({
  user: one(users, {
    fields: [userChats.userId],
    references: [users.id],
  }),
  project: one(projects, { // Add this relation
    fields: [userChats.projectId],
    references: [projects.id],
  }),
}));
```

**3. Update queries to filter by project**:

```typescript
// Before (user-only)
const chats = await db.query.userChats.findMany({
  where: eq(tables.userChats.userId, userId),
});

// After (project-scoped)
const chats = await db.query.userChats.findMany({
  where: and(
    eq(tables.userChats.userId, userId),
    eq(tables.userChats.projectId, projectId)
  ),
});
```

**4. Generate and run migration**:

```bash
npm run db:generate
# Review the generated migration in server/db/migrations/
# Apply migration via NuxtHub dashboard or wrangler
```

**5. Update API endpoints** to require `projectId` and validate user has access to that project using `getUserProjectRole()` from `server/db/queries.ts`.

This pattern allows you to scale the boilerplate from user-centric features to full multi-tenant isolation as your SaaS grows.

## Authentication

Uses `nuxt-auth-utils` for session management:

```typescript
// Check if user is logged in (client-side)
const { loggedIn, user, session } = useUserSession()

// Require authentication on a page
definePageMeta({ middleware: 'authenticated' })

// Server-side: require session
const { user } = await requireUserSession(event)
```

## AI Integration

Uses Vercel AI SDK v6 with OpenAI GPT via Cloudflare AI Gateway:

```typescript
// Client-side streaming chat
const { messages, input, handleSubmit } = useChat({
  api: '/api/embed/chats/[id]'
})

// Server-side: stream AI response with tools
return streamText({
  model: aiGateway([openai('gpt-5.1-chat-latest')]), // via Cloudflare AI Gateway
  messages,
  tools: { getInformation, contactHumanSupport }
})
```

**AI Search (AutoRAG) Development:**
To test the knowledge base search functionality (`getInformation` tool), you must use `npm run dev:remote`. AI Search operates on R2 buckets, and local file storage is not accessible to the AI Search service.

### Prompt Injection Protection

The boilerplate includes **basic protection** against prompt injection attacks:

**What's Protected:**
- Custom system prompts are sanitized at save time (when admins configure projects)
- Project descriptions are sanitized to remove jailbreak patterns
- User messages are validated for suspicious patterns
- AI responses are monitored for leaked system instructions

**Protection Layer:** `server/utils/ai.ts`
```typescript
sanitizeCustomPrompt()    // Removes jailbreak patterns from admin inputs
validateUserMessage()      // Checks user messages for suspicious content
sanitizeAIResponse()       // Strips leaked instructions from AI output
```

**Important Limitations:**

⚠️ **Perfect prompt injection protection is impossible.** Even major AI companies with dedicated security teams struggle with this. The protections included here:

- ✅ **Will catch 95%+ of casual jailbreak attempts** (pattern-based filtering)
- ✅ **Prevent basic prompt leakage** (system instruction markers)
- ✅ **Stop obvious attacks** ("ignore previous instructions", etc.)
- ❌ **Can be bypassed by determined users** (encoding, typos, creative phrasing)
- ❌ **May have false positives** (legitimate questions flagged as suspicious)

**Recommendations:**
1. Use these protections as a **baseline**, not a guarantee
2. Monitor chat logs for suspicious activity
3. Implement additional security layers based on your risk tolerance
4. Consider semantic similarity detection for high-security use cases
5. Educate users about appropriate widget usage

The current implementation provides **reasonable protection for a boilerplate** and can be extended based on your specific security requirements.

## Embeddable Widget

The boilerplate includes a fully functional embeddable chat widget that can be integrated into any website with a single line of code. The widget provides:

- **Iframe-based isolation** - Runs independently from the host site
- **Customizable appearance** - Logo, colors, and position
- **Responsive design** - Adapts to mobile, tablet, and desktop
- **Domain validation** - Restrict widget usage to approved domains

### Important: Update Widget Script Before Use

Before deploying the embeddable widget, you **must update** `public/embed.js` to replace all NuxtBeyond branding and hardcoded URLs:

**1. Replace all `nuxtbeyond` references with your project name:**
- `window.__nuxtbeyond_loaded` → `window.__yourproject_loaded`
- `window.__nuxtbeyond_config` → `window.__yourproject_config`
- `window.nuxtbeyond` → `window.yourproject`
- `nuxtbeyond-bubble-button` → `yourproject-bubble-button`
- `nuxtbeyond-bubble-window` → `yourproject-bubble-window`
- `nuxtbeyond-loader` → `yourproject-loader`
- `nuxtbeyond-iframe` → `yourproject-iframe`

**2. Replace hardcoded URLs (lines 23-24, 228):**
```javascript
// OLD:
const bubbleIcon = config.logo
  ? `<img src="https://nuxtbeyond.com${config.logo}" ...`
  : `<img src="https://nuxtbeyond.com/images/logo.png" ...`;

iframe.src = `https://nuxtbeyond.com/embed?projectId=${config.projectId}`;

// NEW:
const bubbleIcon = config.logo
  ? `<img src="https://yourdomain.com${config.logo}" ...`
  : `<img src="https://yourdomain.com/images/logo.png" ...`;

iframe.src = `https://yourdomain.com/embed?projectId=${config.projectId}`;
```

**3. Update error messages (line 18):**
```javascript
// OLD:
console.error('NuxtBeyond: projectId is required...');

// NEW:
console.error('YourProject: projectId is required...');
```

### Widget Usage Example

After updating the script, users can embed it on their site with:

```html
<script>
  window.__yourproject_config = {
    projectId: 'your-project-id',
    primaryColor: '#0d9488',
    position: 'bottom-right',
    logo: '/path/to/logo.png'
  };
</script>
<script src="https://yourdomain.com/embed.js"></script>
```

### Widget API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /embed` | Widget UI page (iframe content) |
| `GET /api/embed/[id]` | Get project configuration |
| `POST /api/embed/chats` | Create new chat session |
| `POST /api/embed/chats/[id]` | Send message, stream AI response |

## Database

Uses Drizzle ORM with Cloudflare D1:

```typescript
// Get database instance
const db = useDrizzle()

// Query example
const projects = await db
  .select()
  .from(tables.projects)
  .where(eq(tables.projects.id, projectId))

// Generate migrations
npm run db:generate
```

## Deployment

Deploy to Cloudflare via NuxtHub:

```bash
npx nuxthub deploy
```

Or use the Wrangler CLI:

```bash
npm run build
npm run deploy
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with local resources |
| `npm run dev:remote` | Start development server with remote Cloudflare bindings |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint with auto-fix |
| `npm run typecheck` | TypeScript type checking |
| `npm run db:generate` | Generate database migrations |

### Remote Development Environment

Use `npm run dev:remote` to test with actual Cloudflare resources during development:

```bash
npm run dev:remote
```

This connects to your remote Cloudflare resources (D1 database, KV, R2, AI, Browser) instead of local emulation.

**When to use remote mode:**
- **Testing AI Search (AutoRAG)** - AI Search requires real R2 buckets. Local file storage is not accessible to AI Search.
- Testing with production-like data
- Debugging issues specific to Cloudflare infrastructure
- Verifying API Gateway and AI integrations

**Configuration:**
Remote resource IDs are set in `wrangler.jsonc` under the `env.remote` section:

```jsonc
{
  "env": {
    "remote": {
      "d1_databases": [
        {
          "binding": "DB",
          "remote": true,
          "preview_database_id": "your-database-id"
        }
      ],
      "r2_buckets": [
        {
          "binding": "BLOB",
          "remote": true,
          "bucket_name": "your-bucket-name"
        }
      ],
      "kv_namespaces": [
        {
          "binding": "KV",
          "remote": true,
          "id": "your-kv-namespace-id"
        }
      ]
    }
  }
}
```

> **Important:** AI Search (AutoRAG) MUST use remote mode because it requires R2 buckets linked to your AI Search instance. Files stored locally via `npm run dev` are not accessible to AI Search.

## Tech Stack

- **Framework:** Nuxt 4, Vue 3, TypeScript
- **UI:** Nuxt UI v4, Tailwind CSS
- **Database:** Cloudflare D1, Drizzle ORM
- **AI:** Vercel AI SDK v6, OpenAI GPT via Cloudflare AI Gateway, Cloudflare AI Search
- **Auth:** nuxt-auth-utils, Google OAuth
- **Payments:** Stripe
- **Email:** Resend
- **Deployment:** NuxtHub, Cloudflare Workers

## License

Proprietary License - see LICENSE file for details.

You may use this software to build your own applications, but you may not redistribute, sell, or share the boilerplate itself.

## Support

- [Documentation](https://nuxtbeyond.com/docs)
- [GitHub Issues](https://github.com/nuxtbeyond/nuxt-beyond/issues)
