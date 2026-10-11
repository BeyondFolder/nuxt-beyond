---
title: 'Deploying a Multi-Tenant SaaS to Cloudflare Workers (Nuxt 4 Guide)'
description: 'How to model tenants, scope every query, and ship a multi-tenant Nuxt 4 SaaS to Cloudflare Workers with D1, R2, and KV, including the deploy gotchas nobody warns you about.'
seo:
  title: 'Multi-Tenant SaaS on Cloudflare Workers with Nuxt 4 (2026 Guide)'
  description: 'A practical guide to building a multi-tenant SaaS in Nuxt 4 and deploying it to Cloudflare Workers: tenant modeling with D1 and Drizzle, query scoping, roles, per-tenant limits, bindings, and migrations.'
image:
  src: /images/homepage/demo.png
authors:
  - name: Rares Serban
    to: /about
    avatar:
      src: /images/rares-serban.jpg
date: 2026-08-29
badge:
  label: Tutorial
---

Multi-tenancy is one of those things that looks like a weekend of work and then quietly eats a month. The data model is easy. The part that kills you is that every single query, every file path, every rate limit key and every webhook handler has to agree on which tenant it's operating in, forever, with no exceptions.

Miss one, and a customer sees another customer's data. That's the whole risk in one sentence.

This guide covers how to build a multi-tenant SaaS in Nuxt 4 and deploy it to Cloudflare Workers. Tenant modeling with D1 and Drizzle, scoping queries so you can't leak data by accident, per-tenant limits tied to billing, and the deploy details that only show up after your first production push.

The code here is close to what runs in [NuxtBeyond](/#pricing), so it's been through the "why is this 500ing only in production" phase.

## Pick your tenancy model first

Three options, and the choice mostly comes down to how much operational pain you want.

**Database per tenant.** Every customer gets their own database. Strongest isolation, easiest compliance story, and a nightmare to migrate once you have 400 of them. On Cloudflare this is actually more viable than elsewhere because D1 databases are cheap and you can create them via API, but you still have to run every migration 400 times and your dashboard queries can't join across tenants.

**Schema per tenant.** Standard Postgres pattern. Doesn't apply here, since D1 is SQLite and has no schemas.

**Shared database, row-level scoping.** One database, every tenant-owned row carries a `projectId` (or `orgId`, or `workspaceId`, pick a noun and never change it). Simplest to operate, one migration to run, and all the safety lives in your query layer.

For a SaaS that's pre-scale, shared database with row-level scoping is the right default. It's what I'd pick again. The rest of this guide assumes it.

One thing worth deciding early: what's the tenant? Not the user. If your tenant is the user, adding teams later means rewriting every query you've ever written. Make the tenant a first-class row from day one, even if in month one each tenant has exactly one member.

## The schema

Here's the core of it in Drizzle, targeting D1:

```typescript
export const projects = sqliteTable(
  'projects',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text().notNull(),
    description: text(),
    configuration: text({ mode: 'json' }),
    planName: text({ enum: planNames }).notNull(),
    subscriptionStatus: text().notNull().default('active'),
    stripeCustomerId: text(),
    stripeSubscriptionId: text(),
    createdAt: integer({ mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index('projectPlanIdx').on(t.planName),
    index('projectStripeSubscriptionIdx').on(t.stripeSubscriptionId),
  ]
);

export const projectMembers = sqliteTable(
  'projectMembers',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text()
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text({ enum: ['admin', 'member'] }).notNull(),
  }
);
```

A few decisions baked into that.

`projectMembers` is a join table, so a user can belong to several tenants with a different role in each. Billing lives on the project row, not the user row, because in B2B the thing being sold is the workspace.

UUIDs instead of autoincrement integers. Sequential IDs in URLs invite people to try `/projects/124` and see what happens. UUIDs don't make you secure on their own (you still check membership on every request), but they remove the free enumeration.

`onDelete: 'cascade'` on the foreign keys means deleting a project cleans up its members. Note that D1 needs `PRAGMA foreign_keys = ON` for cascades to fire, which NuxtHub and Wrangler handle for you, but it's worth verifying with an actual delete before you trust it.

The index on `projectId` matters more than it looks. Every tenant-scoped query filters on it, so without the index you're doing a full table scan on every request. On SQLite that's fast until it suddenly isn't.

## Scope every query, no exceptions

This is the part that actually protects your customers. The rule: the `projectId` from the URL is user input. Never query with it directly, always verify membership in the same round trip.

```typescript
export async function getUserProjectWithRole(db: Database, userId: string, projectId: string) {
  const result = await db
    .select({
      project: tables.projects,
      role: tables.projectMembers.role,
    })
    .from(tables.projects)
    .innerJoin(tables.projectMembers, eq(tables.projects.id, tables.projectMembers.projectId))
    .where(and(eq(tables.projectMembers.userId, userId), eq(tables.projects.id, projectId)))
    .limit(1);

  return result?.[0];
}
```

The `innerJoin` on `projectMembers` is the security boundary. If the user isn't a member, you get an empty array, and you never had to write a separate permission check that someone could forget.

Then every endpoint follows the same three lines:

```typescript
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const projectId = getRouterParam(event, 'id');

  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: 'Project ID is required' });
  }

  const db = useDrizzle();
  const userProject = await getUserProjectWithRole(db, session.user.id, projectId);

  if (!userProject) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You do not have access to this project',
    });
  }

  // safe from here: userProject.project and userProject.role are yours
});
```

Return 403 rather than 404 when the project exists but isn't theirs, or 404 for both if you care about not confirming existence. Pick one and be consistent, because inconsistency is itself a leak.

For role checks, do it after the membership check and keep it explicit:

```typescript
if (userProject.role !== 'admin') {
  throw createError({ statusCode: 403, statusMessage: 'Admin access required' });
}
```

Hiding the button in the UI is not a permission check. It's a courtesy. Assume every endpoint will be called directly with curl, because eventually it will be.

## Tenant switching without a subdomain per customer

Subdomain routing (`acme.yourapp.com`) looks professional and costs you a wildcard DNS record, a wildcard certificate, and a cookie domain problem. For most B2B dashboards, keeping the active tenant in the session is enough and takes an afternoon.

```typescript
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const { projectId } = await readValidatedBody(event, bodySchema.parse);

  const role = await getUserProjectRole(useDrizzle(), session.user.id, projectId);

  if (!role) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You are not a member of this project',
    });
  }

  await replaceUserSession(event, { ...session, projectId });

  return setResponseStatus(event, 204);
});
```

`nuxt-auth-utils` seals the session into an encrypted cookie, so the active `projectId` travels with the request and there's no server-side session store to run at the edge. That last part matters on Workers, where you don't have a long-lived process to keep session state in.

Important: the session `projectId` is a convenience for the UI, not an authorization decision. Your API routes still verify membership per request using the route param. If you skip that because "the session already has the project", you've built a system where a stale cookie is an access grant.

## Per-tenant limits tied to the plan

Multi-tenancy and billing are the same problem wearing different hats. Once every row belongs to a tenant, quotas become a count with a `where` clause.

Keep the limits in shared constants so both the server and the UI read the same numbers:

```typescript
export const PLANS_CONSTANTS = {
  free: { MAX_NB_OF_FILES: 5, MAX_FILE_SIZE: 0.1, AI_REPLIES: 200 },
  pro: { MAX_NB_OF_FILES: 20, MAX_FILE_SIZE: 1, AI_REPLIES: 2000 },
  advanced: { MAX_NB_OF_FILES: 50, MAX_FILE_SIZE: 2, AI_REPLIES: 5000 },
};
```

Then enforce on the server, in a util that throws:

```typescript
export function validateFileUploadLimit(project: Project) {
  const maxFiles = PLANS_CONSTANTS[project.planName].MAX_NB_OF_FILES;
  const config = project?.configuration as ProjectConfiguration;
  const currentCount = config?.fileCount || 0;

  if (currentCount >= maxFiles) {
    throw createError({
      statusCode: 400,
      statusMessage: `File limit reached. You can upload a maximum of ${maxFiles} file(s). Please remove some files or upgrade your plan.`,
    });
  }

  return { currentCount, maxFiles };
}
```

For usage that changes constantly (AI replies this month, API calls), count it with a query instead of maintaining a counter, at least until the query gets slow:

```typescript
const result = await db
  .select({ count: count() })
  .from(tables.messages)
  .innerJoin(tables.chats, eq(tables.messages.chatId, tables.chats.id))
  .where(
    and(
      eq(tables.chats.projectId, projectId),
      eq(tables.messages.role, 'assistant'),
      gte(tables.messages.createdAt, firstDayOfCurrentMonth)
    )
  );
```

Counting is slower than a cached number and correct by construction. Counters drift the first time a webhook retries. Start with the count, add a cached value when it actually hurts.

Your webhook handler is the other place tenancy shows up. It finds the project by the stored subscription ID, not by anything in the session, since there is no session on a webhook request. If you're still choosing a provider, I compared the two options in [Stripe vs Polar](/blog/stripe-vs-polar-which-to-choose).

## Tenant-scoped storage and rate limits

R2 has no folders, only key prefixes, so put the tenant at the front of the key:

```typescript
const key = `${projectId}/${crypto.randomUUID()}-${file.name}`;
```

That gives you one-line listing per tenant and a clean delete-everything path when someone churns. Never build the key from a user-supplied filename alone, and validate the project before you write, or you've given anyone with an upload form a way to write into another tenant's prefix.

Rate limiting works the same way, with KV as the store:

```typescript
export async function checkRateLimit(event: H3Event, config: RateLimitConfig) {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown';
  const key = `${config.keyPrefix || 'ratelimit'}:${ip}`;

  const data = await kv.get<{ count: number; resetAt: number }>(key);
  // ...increment, or reset the window if data.resetAt has passed
}
```

Key by IP for anonymous traffic (login, signup, public widget endpoints) and by `projectId` for authenticated tenant work. If you only key by IP, one customer behind a corporate NAT can rate limit their whole office. If you only key by project, a single abusive script hits your origin as hard as it likes before the project limit trips.

KV is eventually consistent, so treat these counts as approximate. That's fine for abuse prevention and wrong for billing.

## Deploying to Cloudflare Workers

Nitro has a Cloudflare preset, so the Nuxt side is short:

```typescript
export default defineNuxtConfig({
  nitro: {
    preset: 'cloudflare-module',
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },
  },
});
```

Bindings live in `wrangler.jsonc`, and they're what your Worker can actually reach at runtime:

```jsonc
{
  "name": "nuxt-beyond",
  "main": "./.output/server/index.mjs",
  "compatibility_date": "2025-12-14",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": "./.output/public/",
    "binding": "ASSETS"
  },
  "d1_databases": [{ "binding": "DB", "database_id": "your-d1-id" }],
  "kv_namespaces": [{ "binding": "KV", "id": "your-kv-id" }],
  "r2_buckets": [{ "binding": "BLOB", "bucket_name": "your-bucket" }],
  "keep_vars": true
}
```

Then `npx nuxthub deploy` or `wrangler deploy`, depending on whether you want the NuxtHub layer on top.

Here's what actually bites you.

**Bindings are not inheritable across environments.** If you add an `env.remote` block to test against production resources, you have to redeclare every binding inside it. Wrangler will not merge them with the top-level ones, and the failure looks like a binding that's mysteriously undefined.

**Build-time and runtime variables are two different lists.** Anything used during prerendering, sitemap generation, or SSR at build time has to be set in the build environment variables, not just in the Worker's runtime secrets. `NUXT_PUBLIC_SITE_URL` is the classic one: your local build is fine, production ships with canonical URLs pointing at nothing.

**`keep_vars: true` stops deploys from wiping dashboard variables.** Without it, deploying can clear secrets you set through the Cloudflare UI, and you find out when Stripe webhooks start failing signature verification. Your session secret is one of those dashboard secrets, so if you still need a value, you can [generate a NUXT_SESSION_PASSWORD or NUXT_APP_SECRET](/resources/nuxt-session-password-generator) in your browser.

**No filesystem, no long-lived process.** Anything that writes to `/tmp`, caches in a module-level `Map` and expects it to survive, or spawns a child process will not work. Node compat covers a lot, but it doesn't give you a server. In-memory caches are per-isolate and can vanish between two consecutive requests.

**Subrequest limits are real.** Each request gets a capped number of outbound `fetch` calls: 50 on the free plan, 1000 on paid. A page that does an AI call plus a handful of D1 queries is nowhere near it, but a loop that fetches per row will hit the wall at a customer-dependent size, which is the worst kind of bug.

**CPU time is metered, wall clock is not.** Waiting 20 seconds for a streaming model response barely costs CPU, since the isolate isn't doing work while it awaits. What costs you is parsing a large JSON payload or doing crypto in a loop.

**Migrations run against a remote database.** Generate with `npm run db:generate`, then apply them to the real D1 instance. Local dev uses a separate SQLite file, so "it worked locally" tells you nothing about whether the migration applied in production. Check before you assume.

## D1 constraints worth knowing before you commit

D1 is SQLite, and SQLite has opinions. A single database currently maxes at 10 GB, which is a lot of rows for a B2B SaaS but not much if tenants upload blobs into columns (put files in R2 and store the key). There's no `ALTER COLUMN` in the SQLite sense, so column type changes become table rebuilds, which Drizzle Kit generates for you but you should read before running.

Writes go through a single primary, with read replication available. For read-heavy dashboards that's the shape you want anyway.

If you outgrow it, Drizzle makes the escape hatch cheap: swap the driver to Postgres on Neon or Supabase and keep your query code. That's a real argument for the shared-database model, since moving one database is a project and moving 400 is a career.

## When Workers is the wrong call

Being fair about it: if you need long-running background jobs, a persistent WebSocket server you control, native Node modules, or Postgres-specific features like full-text search over millions of rows, a regular container on Fly or Railway will annoy you less. Queues and Durable Objects cover a lot of that, but you're learning Cloudflare-specific tools instead of ones you already know.

Workers is the right call when your app is request-response, your data fits SQLite, and you'd rather pay per request than per idle hour. That describes most early SaaS, including the AI kind, since the expensive part is the model call, not your compute.

## Putting it together

The whole multi-tenant story is four habits: a tenant table that isn't the user table, a query helper that joins membership so scoping is automatic, plan limits enforced server-side, and tenant-prefixed keys in every store you touch.

The Cloudflare part is mostly configuration discipline: declare bindings per environment, keep build-time and runtime variables in sync, and verify migrations ran against the remote database.

If you'd rather not wire this yourself, [NuxtBeyond](/#pricing) ships with it done: multi-tenant projects with roles and invitations, D1 and Drizzle with the query layer above, R2 uploads scoped per project, KV rate limiting, Stripe or Polar billing per tenant, and a working `wrangler.jsonc` for both local and remote development. It's :launch-price one-time with lifetime updates, and unlimited projects, so agencies can use it across client work.

Related reading: the [RAG chatbot guide](/blog/how-to-build-ai-chatbot-with-rag-nuxt-4) covers the AI side on the same stack, the [embeddable widget tutorial](/blog/embeddable-chat-widget-nuxt-4) covers shipping a tenant's chatbot onto their own site, and [best Nuxt boilerplates compared](/blog/best-nuxt-boilerplates-compared) is the honest rundown if you're still evaluating options.
