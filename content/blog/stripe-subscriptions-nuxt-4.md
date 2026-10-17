---
title: 'Stripe Subscriptions in Nuxt 4: Checkout, Webhooks, and the Customer Portal'
description: 'A practical guide to wiring Stripe subscriptions into a Nuxt 4 app: checkout sessions, webhook signature verification on the edge, plan upgrades, cancellations, and enforcing limits server-side.'
seo:
  title: 'Stripe Subscriptions in Nuxt 4: Webhooks, Checkout & Portal (2026)'
  description: 'How to add Stripe subscriptions to Nuxt 4: price lookup keys, checkout sessions, webhook signature verification on Cloudflare Workers, the customer portal, and plan limit enforcement.'
image:
  src: /images/homepage/demo.png
authors:
  - name: Rares Serban
    to: /about
    avatar:
      src: /images/rares-serban.jpg
date: 2026-09-05
badge:
  label: Tutorial
---

Adding Stripe to a Nuxt app looks like a two hour job. Install the module, create a checkout session, redirect the user, done.

Then you discover the actual work: your database has to stay in sync with Stripe's idea of the subscription, forever, through upgrades, downgrades, failed payments, cancellations that take effect next month, and reactivations. That sync is the whole feature, and checkout is maybe 10% of it.

This guide covers the full path in Nuxt 4: checkout sessions, webhook signature verification (including the part that breaks on Cloudflare Workers), the customer portal, and enforcing plan limits server-side. The code is close to what ships in [NuxtBeyond](/#pricing), so it's been through production rather than just the docs.

## What you're actually building

Six pieces, in order of how likely they are to bite you:

1. A checkout session endpoint that maps a plan to a Stripe price
2. A webhook handler that verifies signatures and updates your database
3. A customer portal session so users manage their own billing
4. Plan limits enforced on the server, not just hidden in the UI
5. A way to test all of it locally
6. Correct environment variables in production (this one causes more outages than the rest combined)

## Setup

Install the Stripe module for Nuxt:

```bash
npm install @unlok-co/nuxt-stripe
```

Then wire it into `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ['@unlok-co/nuxt-stripe'],

  runtimeConfig: {
    stripe: {
      key: '', // overridden by NUXT_STRIPE_KEY
    },
    public: {
      siteUrl: '', // overridden by NUXT_PUBLIC_SITE_URL
      stripe: {
        key: '', // overridden by NUXT_PUBLIC_STRIPE_KEY
        manualClientLoad: true,
      },
    },
  },
});
```

Empty strings with a `NUXT_` prefixed env var is the Nuxt pattern for runtime config. The value gets injected at runtime instead of baked into the build, which matters when you deploy the same bundle to staging and production.

`manualClientLoad: true` stops Stripe.js from loading on every page. If you're using hosted Checkout (you should, for subscriptions), the browser barely needs Stripe.js at all. That's one less third-party script on your landing page.

Your `.env`:

```bash
NUXT_STRIPE_KEY=sk_test_...
NUXT_PUBLIC_STRIPE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NUXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Put the subscription on the tenant, not the user

Before any Stripe code, decide what owns the subscription. In B2B the thing being sold is the workspace, not the person. If you attach `stripeCustomerId` to the user row, adding teams later means migrating every billing record you have.

Here's the shape in Drizzle, targeting Cloudflare D1:

```typescript
export const projects = sqliteTable(
  'projects',
  {
    id: text().primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text().notNull(),
    planName: text({ enum: planNames }).notNull(),
    subscriptionStatus: text().notNull().default('active'),
    stripeCustomerId: text(),
    stripeSubscriptionId: text(),
    stripeCurrentPeriodEnd: integer({ mode: 'timestamp' }),
  },
  (t) => [
    index('projectPlanIdx').on(t.planName),
    index('projectStripeSubscriptionIdx').on(t.stripeSubscriptionId),
  ]
);
```

Four columns carry the state. `planName` is what your app reads for feature gating. `subscriptionStatus` tracks whether the subscription is active, past due, or scheduled to cancel. `stripeSubscriptionId` is how webhooks find the right row, so it needs an index. Without it, every webhook does a full table scan, which is fine at 50 customers and not fine at 5,000.

`stripeCurrentPeriodEnd` is only populated when a cancellation is scheduled, so the UI can say "active until March 12" instead of just "canceling."

The multi-tenant modeling around this (members, roles, query scoping) is covered in the [multi-tenant SaaS guide](/blog/multi-tenant-saas-cloudflare-workers-nuxt-4).

## Use price lookup keys, not hardcoded price IDs

Most tutorials hardcode `price_1Ab2Cd...` in an env var. That works until you have three plans across test and live mode, and now you have six env vars that nobody can read at a glance.

Lookup keys fix this. In the Stripe dashboard, give each price a lookup key like `pro_monthly`. Then resolve it at runtime:

```typescript
const stripe = await useServerStripe(event);

const prices = await stripe.prices.list({
  lookup_keys: [`${planName}_monthly`],
  expand: ['data.product'],
});

const priceId = prices.data?.[0]?.id;

if (!priceId) {
  throw createError({
    statusCode: 500,
    statusMessage: `Price ID not found for plan: ${planName}`,
  });
}
```

The plan name comes from your own constants file, so the mapping between "what my app calls this plan" and "what Stripe charges for it" lives in the Stripe dashboard where your finance-brained self can change it without a deploy.

The bonus shows up in the webhook. Stripe sends back the price object with its `lookup_key`, so you can reverse the mapping with one line instead of a lookup table:

```typescript
const newPlanName = subscription.items.data[0]?.price.lookup_key?.split('_')?.[0];
```

## Creating the checkout session

The endpoint lives at `server/api/projects/[id]/billing/index.post.ts`. Auth check, permission check, then Stripe:

```typescript
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const db = useDrizzle();
  const projectId = getRouterParam(event, 'id');

  const userProject = await getUserProjectWithRole(db, session.user.id, projectId);
  if (!userProject) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' });
  }

  const { role, project } = userProject;
  if (role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Only project admins can manage billing' });
  }

  const { planName } = await readValidatedBody(event, bodySchema.parse);

  return createCheckout({ event, project, planName, userId: session.user.id, userEmail: session.user.email });
});
```

Two things worth calling out. The permission check is `role !== 'admin'`, because a regular team member being able to change the workspace plan is a support ticket waiting to happen. And `readValidatedBody` with a Zod enum means a request body of `{"planName": "free_but_with_everything"}` gets rejected before it reaches Stripe.

The session itself:

```typescript
const config = useRuntimeConfig(event);

const sessionConfig: Record<string, any> = {
  billing_address_collection: 'auto',
  line_items: [{ price: priceId, quantity: 1 }],
  mode: 'subscription',
  success_url: `${config.public.siteUrl}/dashboard?billing_success=true&session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${config.public.siteUrl}/dashboard/billing`,
  metadata: {
    userId,
    projectId: project.id,
    planName,
  },
  automatic_tax: { enabled: true },
  tax_id_collection: { enabled: true },
};

if (project.stripeCustomerId) {
  sessionConfig.customer = project.stripeCustomerId;
  sessionConfig.customer_update = { address: 'auto', name: 'auto' };
} else {
  sessionConfig.customer_email = userEmail;
}

const stripeSession = await stripe.checkout.sessions.create(sessionConfig);

return { url: stripeSession.url };
```

The `metadata` object is the important part. When the webhook fires, Stripe tells you a payment happened, but it has no idea which row in your database to update. The metadata is the only link back. Put `projectId` and `planName` in there and the webhook becomes trivial.

Reusing `customer` when you already have a `stripeCustomerId` matters too. Skip it and a customer upgrading for the second time gets a duplicate Stripe customer record, along with two payment methods, two invoice histories, and one confused founder in the dashboard.

The `{CHECKOUT_SESSION_ID}` in the success URL is a literal placeholder that Stripe substitutes. Don't template it yourself.

On the client, it's one call:

```typescript
async function subscribe(planName: string) {
  const { url } = await $fetch(`/api/projects/${projectId}/billing`, {
    method: 'POST',
    body: { planName },
  });

  if (url) {
    await navigateTo(url, { external: true });
  }
}
```

`external: true` is required. Without it, Nuxt tries to resolve `checkout.stripe.com` as an internal route and nothing happens, which is a fun five minutes of debugging.

## The webhook, where the real work is

Two rules. Never trust the success redirect as proof of payment, and always verify the signature.

The redirect is a browser navigation. Users close the tab, lose connection, or (if you built it wrong) just visit `/dashboard?billing_success=true` manually. The webhook is the source of truth.

```typescript
import { useServerStripe } from '#stripe/server';
import type Stripe from 'stripe';

export default defineEventHandler(async (event) => {
  const stripe = await useServerStripe(event);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const signature = getHeader(event, 'stripe-signature');
  if (!signature) {
    throw createError({ statusCode: 400, message: 'Missing stripe-signature header' });
  }

  const body = await readRawBody(event);
  if (!body) {
    throw createError({ statusCode: 400, message: 'Missing request body' });
  }

  let stripeEvent: Stripe.Event;

  try {
    stripeEvent = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw createError({ statusCode: 400, message: `Webhook Error: ${message}` });
  }

  // handle events...
  return { received: true };
});
```

Two details that cost people hours.

**`readRawBody`, not `readBody`.** The signature is computed over the exact bytes Stripe sent. Parse the JSON first and re-serialize it and the signature won't match, because key order and whitespace changed.

**`constructEventAsync`, not `constructEvent`.** The synchronous version uses Node's crypto module. On Cloudflare Workers, Vercel Edge, or any Web Crypto runtime, that either isn't there or works differently. The async version uses the Web Crypto API and works everywhere, including Node. If your webhook works locally and returns 400 in production, this is usually why.

## The four events that matter

Stripe fires dozens of event types. For a basic subscription SaaS you need four.

**`checkout.session.completed`** fires when someone finishes paying. This is where the subscription starts:

```typescript
case 'checkout.session.completed': {
  const session = stripeEvent.data.object as Stripe.Checkout.Session;

  const projectId = session.metadata?.projectId;
  const planName = session.metadata?.planName as PlanName | undefined;

  if (!projectId || !planName) {
    console.error('Missing projectId or planName in session metadata');
    break;
  }

  await db
    .update(projects)
    .set({
      planName,
      subscriptionStatus: 'active',
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
      stripeCurrentPeriodEnd: null,
    })
    .where(eq(projects.id, projectId));

  break;
}
```

**`customer.subscription.updated`** is the one that does the most work. Plan changes, cancellations scheduled for period end, reactivations, and status transitions like `past_due` all arrive here:

```typescript
case 'customer.subscription.updated': {
  const subscription = stripeEvent.data.object as Stripe.Subscription;

  const project = await db.query.projects.findFirst({
    where: eq(projects.stripeSubscriptionId, subscription.id),
  });

  if (!project) {
    break;
  }

  const newPlanName = subscription.items.data[0]?.price.lookup_key?.split('_')?.[0];

  let subscriptionStatus: string = subscription.status;
  if (subscription.cancel_at_period_end) {
    subscriptionStatus = 'canceling';
  }

  await db
    .update(projects)
    .set({
      planName: (newPlanName || project.planName) as PlanName,
      stripeCurrentPeriodEnd: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
      subscriptionStatus,
    })
    .where(eq(projects.id, project.id));

  break;
}
```

The `cancel_at_period_end` branch is the one people get wrong. When a customer cancels, Stripe doesn't end the subscription immediately, it marks it to end at the period boundary. The status stays `active`. If you only read `subscription.status`, your app shows "active" and the customer keeps full access, which is correct, but you have no idea they're leaving and no way to show them "your plan ends on the 12th." A separate `canceling` status gives you both.

Also note the timestamp conversion. Stripe sends Unix seconds, JavaScript wants milliseconds, so `new Date(subscription.cancel_at * 1000)`. Forget the `* 1000` and your customer's subscription ends in January 1971.

**`customer.subscription.deleted`** fires when the subscription actually ends. Downgrade to free:

```typescript
case 'customer.subscription.deleted': {
  const subscription = stripeEvent.data.object as Stripe.Subscription;

  const project = await db.query.projects.findFirst({
    where: eq(projects.stripeSubscriptionId, subscription.id),
  });

  if (project) {
    await db
      .update(projects)
      .set({
        planName: 'free',
        subscriptionStatus: 'active',
        stripeSubscriptionId: null,
        stripeCurrentPeriodEnd: null,
      })
      .where(eq(projects.id, project.id));
  }

  break;
}
```

Keep `stripeCustomerId` here. Clearing it means a returning customer gets a fresh Stripe customer and loses their invoice history.

**`customer.subscription.trial_will_end`** fires 3 days before a trial ends. Send an email. This is the cheapest conversion win in the whole flow, and it's about 10 lines of code.

Everything else goes to a `default` branch that logs and returns 200. Returning a non-200 tells Stripe to retry, and retrying an event you don't handle just fills your logs.

## Customer portal instead of building billing UI

Don't build plan-change forms, payment method updates, or invoice downloads. Stripe's hosted portal does all of it:

```typescript
const portalSession = await stripe.billingPortal.sessions.create({
  customer: project.stripeCustomerId,
  return_url: `${config.public.siteUrl}/dashboard/billing`,
});

return { url: portalSession.url };
```

That's the whole feature. Configure which plans are switchable and whether cancellation is allowed in the Stripe dashboard, under Settings, Billing, Customer portal. Changes users make there come back to you as `customer.subscription.updated` webhooks, which you already handle.

Weeks of UI work replaced by a redirect. It's the best trade in the entire Stripe API.

## Enforce limits on the server

Hiding an upgrade-gated button in the UI is a UX decision, not a security boundary. Anyone can `curl` your API.

Keep the limits in one shared constants file so client and server read the same numbers:

```typescript
export const PLANS_CONSTANTS: Record<PlanName, PlanConfig> = {
  free: {
    MAX_FILE_SIZE: 0.1 * 1024 * 1024,
    MAX_NB_OF_FILES: 5,
    MAX_NB_OF_AI_REPLIES: 200,
    SUPPORT_ESCALATION: false,
  },
  pro: {
    MAX_FILE_SIZE: 2 * 1024 * 1024,
    MAX_NB_OF_FILES: 50,
    MAX_NB_OF_AI_REPLIES: 5000,
    SUPPORT_ESCALATION: true,
  },
};
```

Then check it inside the endpoint that does the expensive thing:

```typescript
export function validateFileUploadLimit(project: Project) {
  const maxFiles = PLANS_CONSTANTS[project.planName].MAX_NB_OF_FILES;
  const currentCount = (project.configuration as ProjectConfiguration)?.fileCount || 0;

  if (currentCount >= maxFiles) {
    throw createError({
      statusCode: 400,
      statusMessage: `File limit reached. You can upload a maximum of ${maxFiles} file(s). Please remove some files or upgrade your plan.`,
    });
  }

  return { currentCount, maxFiles };
}
```

For AI features this is also cost control. An unmetered chat endpoint on a free plan is someone else's OpenAI bill, and that lesson gets expensive fast. The [RAG chatbot guide](/blog/how-to-build-ai-chatbot-with-rag-nuxt-4) goes deeper on the AI side of the same stack.

## Testing locally

The Stripe CLI forwards real events to localhost:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

It prints a `whsec_...` secret that's different from your dashboard one. Use the printed one in your local `.env`.

Then trigger events without going through checkout:

```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

Triggered events have empty metadata, so your handler should hit the "missing projectId" branch and log instead of crashing. That's a useful test on its own. For a realistic run, use test card `4242 4242 4242 4242` through your real checkout flow, then cancel from the portal and watch the events land.

Card `4000 0000 0000 0341` succeeds at checkout and then fails on the next charge, which is how you test `past_due` handling before a real customer finds it for you.

## Production gotchas

**Register the webhook endpoint and subscribe to the right events.** Stripe dashboard, Developers, Webhooks, add `https://yourdomain.com/api/webhooks/stripe`, then pick the four event types. Copy that endpoint's signing secret into `STRIPE_WEBHOOK_SECRET`. It's different per endpoint, so test mode and live mode each need their own.

**On Cloudflare Workers, set `keep_vars: true` in `wrangler.jsonc`.** Without it, a deploy can wipe variables you set through the dashboard, and the first symptom is webhook signature verification failing on every event while checkout still works fine.

**Webhooks can arrive before your redirect completes, or after.** Don't write logic that assumes an order. The dashboard should read the plan from your database and show a neutral state if the webhook hasn't landed yet.

**Stripe retries failed webhooks for up to 3 days.** Your handler will see the same event more than once. The updates above are idempotent (setting `planName` to `pro` twice is harmless), but the moment you add "send a welcome email" you need to guard it, or a retry storm sends the same email six times.

**Test mode and live mode are separate universes.** Separate customers, prices, webhook secrets, lookup keys. Create your prices in both, with the same lookup keys, or your first live checkout 500s on a missing price.

## When Stripe isn't the right pick

Being fair about it: Stripe makes you the merchant of record, which means sales tax and VAT are your problem. `automatic_tax` calculates the right amount, but you still register, file, and remit in every jurisdiction where you have customers. For a solo founder selling to the EU, that's a real ongoing cost in money and attention.

Merchant-of-record providers like Polar, Paddle, or Lemon Squeezy, or Stripe's own Managed Payments, take a bigger cut and handle all of it. The [Stripe vs Polar comparison](/blog/stripe-vs-polar-which-to-choose) has the full breakdown, including the actual fee math.

The good news is that the architecture above barely changes. Put `createCheckout` and `createPortalSession` behind an interface, pick the implementation from an env var, and the only provider-specific code left is the webhook handler, because each provider signs payloads differently.

## Wrapping up

The pattern that makes subscriptions manageable: metadata carries your database IDs through checkout, webhooks are the source of truth for plan state, lookup keys keep price mapping out of your code, the hosted portal handles all self-serve billing, and limits are enforced in the endpoint that costs you money.

Get those five right and the rest is dashboard configuration.

If you'd rather not build it, [NuxtBeyond](/#pricing) ships with all of it working: Stripe and Polar behind one provider interface, the webhook handlers above, the customer portal, per-project subscriptions with roles, and plan limits wired into the AI and upload endpoints. It's :launch-price one-time, with lifetime updates and unlimited projects.

Related reading: the [multi-tenant SaaS guide](/blog/multi-tenant-saas-cloudflare-workers-nuxt-4) for the tenant modeling this billing sits on top of, the [embeddable widget tutorial](/blog/embeddable-chat-widget-nuxt-4) for shipping a paid feature onto customer sites, and [best Nuxt boilerplates compared](/blog/best-nuxt-boilerplates-compared) if you're still evaluating options.
