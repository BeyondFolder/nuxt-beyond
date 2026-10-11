---
title: 'How to Build an Embeddable Chat Widget in Nuxt 4 (Complete Tutorial)'
description: 'A full walkthrough of building an embeddable chat widget with Nuxt 4 and Cloudflare: the loader script, iframe isolation, domain whitelisting, sessions without third-party cookies, and rate limiting.'
seo:
  title: 'Embeddable Chat Widget Tutorial for Nuxt 4 (2026)'
  description: 'Build an embeddable chat widget in Nuxt 4 with a one-line script tag, iframe isolation, referer and domain validation, sealed sessions, and Cloudflare KV rate limiting.'
image:
  src: /images/homepage/demo2.png
authors:
  - name: Rares
    to: https://x.com/Raress96_
    avatar:
      src: /images/avatar.png
date: 2026-08-22
badge:
  label: Tutorial
---

Every chatbot SaaS ends up in the same place: your customer wants a bubble in the corner of their site, and they want to install it by pasting one script tag into their footer.

That script tag is deceptively hard. It runs on a page you don't control, next to CSS you've never seen, inside a Content Security Policy someone wrote in 2019. Your session cookies are third-party cookies there, so Safari drops them. Your bubble fights whatever `z-index: 99999` element the site owner already has. And anyone who reads the page source can copy the snippet onto their own domain and burn your API credits.

This guide walks through building that widget properly in Nuxt 4 on Cloudflare. The code is close to what actually ships in [NuxtBeyond](/#pricing), so it's been through the "why doesn't this work on Safari" phase already.

## What we're building

Three pieces:

1. A **loader script** (`/embed.js`) that the customer pastes into their site. It creates a bubble button and an iframe.
2. An **embed page** (`/embed`) inside your Nuxt app that renders the actual chat UI, themed per customer.
3. A **server layer** that validates who's allowed to embed, issues a session, and rate limits abuse.

The chat itself is out of scope here. If you need the AI side, I covered retrieval and streaming in the [RAG chatbot guide](/blog/how-to-build-ai-chatbot-with-rag-nuxt-4).

## Why an iframe and not inline DOM

You have two options for rendering a widget on someone else's page.

**Inline DOM** means injecting your Vue app straight into their document. It's lighter and lets you animate against page content, but you inherit their CSS. A global `button { text-transform: uppercase }` or a `* { box-sizing: content-box }` reset will wreck your layout, and you'll spend your life shipping fixes for one customer's Bootstrap theme. Shadow DOM helps but doesn't solve JS globals or CSP.

**An iframe** gives you a hard boundary. Their CSS can't reach in, your CSS can't leak out, and your JS runs in its own realm. The cost is that you can't share cookies easily and you have to manage sizing from outside.

For a chat widget the iframe wins. The panel is a fixed rectangle in a corner, so you don't need to reflow around page content, and style isolation is worth more than the sizing hassle.

## Step 1: the loader script

The loader lives in `public/embed.js` so Nuxt serves it as a static asset. It's plain ES5-ish JavaScript, no bundler, no framework. It has to run on a page that might be from 2014.

Start with config and validation. Never trust what the site owner passes in, because it goes into inline styles and URLs:

```js
(function () {
  if (window.__nuxtbeyond_loaded) {
    console.warn('Widget already loaded');
    return;
  }

  function isValidHexColor(color) {
    return /^#[0-9A-F]{6}$/i.test(color);
  }

  const config = {
    ...{
      projectId: '',
      primaryColor: '#0d9488',
      position: 'bottom-right',
      logo: null,
    },
    ...(window.__nuxtbeyond_config || {}),
  };

  if (!config.projectId) {
    console.error('Widget: projectId is required.');
    return;
  }

  if (!isValidHexColor(config.primaryColor)) {
    console.warn('Invalid primaryColor. Using default.');
    config.primaryColor = '#0d9488';
  }
})();
```

The hex check isn't cosmetic. `primaryColor` gets interpolated into a `style` attribute, and an unvalidated string is a CSS injection waiting to happen. Same story for the logo path, which gets appended to your domain:

```js
function sanitizePath(path) {
  if (!path || typeof path !== 'string') return null;
  const sanitized = path.replace(/[^\w\-\/\.]/g, '');
  if (sanitized.includes('..')) return null;
  return sanitized.startsWith('/') ? sanitized : '/' + sanitized;
}
```

The double-load guard at the top matters more than it looks. Site owners paste the snippet into a header partial, then into a page template, then into Google Tag Manager, and now you have three bubbles.

## Step 2: the bubble and the z-index war

Create the button with inline styles. External stylesheets can be blocked by CSP, and inline styles on the element beat almost anything the host page has:

```js
const Z_INDEX = {
  button: 2147483645,
  container: 2147483646,
};

const button = document.createElement('button');
button.setAttribute('aria-label', 'Open chat');
button.style.cssText = `
  position: fixed;
  ${config.position.includes('bottom') ? 'bottom: 1rem;' : 'top: 1rem;'}
  ${config.position.includes('right') ? 'right: 1rem;' : 'left: 1rem;'}
  width: 55px;
  height: 55px;
  border-radius: 50%;
  border: none;
  background-color: ${config.primaryColor};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  z-index: ${Z_INDEX.button};
  display: flex;
  align-items: center;
  justify-content: center;
`;
```

2147483647 is the maximum 32-bit signed integer and the highest `z-index` browsers accept. Sit one below it for the button and use the top slot for the panel. Going for the absolute max is tempting, but leaving a rung above you means a site owner can still put their cookie banner on top when they need to (legally, they often need to).

Position is configurable because "bottom-right" collides with cookie consent bars, live chat from another vendor, and back-to-top buttons. Give people the escape hatch on day one.

## Step 3: lazy-load the iframe

Don't load the iframe on page load. The customer's Lighthouse score is your problem too, and most visitors never open the chat. Create the element, but only set `src` on first click:

```js
let isLoaded = false;
let loadTimeout = null;

button.onclick = () => {
  const isOpen = container.style.display !== 'none';

  if (isOpen) {
    container.style.display = 'none';
    button.innerHTML = bubbleIcon;
    container.setAttribute('aria-hidden', 'true');
    return;
  }

  container.style.display = 'flex';
  button.innerHTML = closeIconSVG;
  container.setAttribute('aria-hidden', 'false');

  if (isLoaded) return;

  button.disabled = true;
  loader.style.display = 'flex';

  loadTimeout = setTimeout(() => {
    loader.innerHTML = '<p>Failed to load chat</p>';
  }, 10000);

  iframe.src = `https://yourdomain.com/embed?projectId=${config.projectId}`;

  iframe.onload = () => {
    clearTimeout(loadTimeout);
    loader.style.display = 'none';
    iframe.style.visibility = 'visible';
    isLoaded = true;
    button.disabled = false;
  };
};
```

The 10 second timeout is there because `iframe.onerror` is unreliable. If the host page's CSP has a `frame-src` directive that doesn't include your domain, the frame silently stays blank and no error fires. A timeout that says "this may be your Content Security Policy" saves you a support ticket, and it's the single most common reason a correctly installed widget shows nothing.

## Step 4: responsive sizing from the parent

The iframe has no idea how wide the viewport is in a useful way, so size the container from the parent and re-run on resize:

```js
const updateContainerSize = () => {
  const isMobile = window.innerWidth < 640;
  const currentDisplay = container.style.display;

  if (isMobile) {
    container.style.cssText = `
      position: fixed;
      top: 3vh;
      left: 50%;
      transform: translateX(-50%);
      width: 90%;
      height: 85vh;
      border-radius: 1rem;
      display: ${currentDisplay};
      z-index: ${Z_INDEX.container};
      background-color: white;
      overflow: hidden;
    `;
  } else {
    container.style.cssText = `
      position: fixed;
      ${config.position.includes('bottom') ? 'bottom: 85px;' : 'top: 85px;'}
      ${config.position.includes('right') ? 'right: 1rem;' : 'left: 1rem;'}
      width: 420px;
      height: 85vh;
      max-height: 700px;
      border-radius: 1.25rem;
      display: ${currentDisplay};
      z-index: ${Z_INDEX.container};
      background-color: white;
      overflow: hidden;
    `;
  }
};

updateContainerSize();
window.addEventListener('resize', updateContainerSize);
```

Note the `currentDisplay` capture. Rewriting `cssText` nukes every property including `display`, so a resize while the panel is open would close it. On mobile, centering the panel instead of anchoring it to a corner is deliberate: the on-screen keyboard eats the bottom half of the viewport, and a bottom-anchored panel puts your input field underneath it.

## Step 5: a programmatic API

Customers will want to open the chat from their own "Need help?" button. Expose a tiny global, and handle the case where they called it before your script finished loading:

```js
const oldQueue = window.nuxtbeyond && window.nuxtbeyond.q ? window.nuxtbeyond.q : [];

window.nuxtbeyond = {
  open: () => {
    if (container.style.display === 'none') button.click();
  },
  close: () => {
    if (container.style.display !== 'none') button.click();
  },
  toggle: () => button.click(),
  getState: () => (isLoaded ? 'loaded' : 'loading'),
};

window.__nuxtbeyond_loaded = true;

oldQueue.forEach((args) => {
  const [method, ...params] = args;
  if (typeof window.nuxtbeyond[method] === 'function') {
    window.nuxtbeyond[method](...params);
  }
});
```

That's the same command-queue pattern Google Analytics uses. A stub script pushes calls into `window.nuxtbeyond.q`, and the real script drains the queue when it arrives.

## Step 6: the embed page in Nuxt

Now the Nuxt side. `app/pages/embed.vue` renders the chat with no layout and no prerendering, since every customer gets different branding:

```vue
<script setup lang="ts">
import type { ProjectConfiguration } from '#shared/types';

definePageMeta({
  layout: false,
});

defineRouteRules({
  prerender: false,
});

const route = useRoute();
const projectId = computed(() => (route.query.projectId as string) || '');

const { data: project, error, pending } = await useFetch(`/api/embed/${projectId.value}`);

const config = computed(() => (project.value?.configuration as ProjectConfiguration) || {});
const primaryColor = computed(() => config.value?.appearance?.primaryColor || '#0d9488');

onMounted(() => {
  if (!error.value) {
    document.documentElement.style.setProperty('--ui-primary', primaryColor.value);
  }
});
</script>
```

Theming through a CSS variable means you get per-customer branding without a build step. Nuxt UI v4 reads `--ui-primary`, so setting it at runtime recolors every component in the widget.

One Nuxt-specific gotcha: your app's global `routeRules` probably set a strict `Content-Security-Policy` with `frame-ancestors 'self'`. That header will block your own widget everywhere. Scope security headers to the routes that need them and leave `/embed` framable:

```ts
routeRules: {
  '/': {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': [
        "default-src 'self'",
        "frame-src 'self' https:",
        "script-src 'self' 'unsafe-inline' https:",
        "object-src 'none'",
      ].join('; '),
    },
  },
}
```

## Step 7: stop people from stealing your widget

The snippet is public. Anyone can copy it, and your `projectId` is right there in the HTML. Two checks keep that from becoming a bill.

First, read the referer and compare it against the domains the customer whitelisted:

```ts
export function validateReferer(event: H3Event) {
  const referer = getHeader(event, 'referer') || getHeader(event, 'referrer');

  if (!referer) {
    throw createError({
      statusCode: 403,
      statusMessage: 'This widget must be embedded on a website',
    });
  }

  return { referer, refererDomain: new URL(referer).hostname };
}

export function validateDomain(project: { configuration: ProjectConfiguration }, refererDomain: string) {
  const allowedDomains = project.configuration?.security?.allowedDomains || [];

  if (allowedDomains.length === 0) return;

  const isAllowed = allowedDomains.some((domain) => {
    const normalized = domain.toLowerCase().trim();
    const referer = refererDomain.toLowerCase();
    return normalized === referer || referer.endsWith(`.${normalized}`);
  });

  if (!isAllowed) {
    throw createError({
      statusCode: 403,
      statusMessage: `Domain ${refererDomain} is not allowed to embed this widget`,
    });
  }
}
```

The `endsWith('.' + domain)` check is what lets `app.customer.com` through when they whitelisted `customer.com`. Note the leading dot, without it `evilcustomer.com` would pass.

Referer headers can be spoofed with curl, so this is not authentication. It stops the copy-paste thief and the accidental staging deployment, which is 95% of the real problem. Rate limiting handles the rest.

Then wire it into the config endpoint, `server/api/embed/[id].get.ts`:

```ts
export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, 'id');
  const db = useDrizzle();
  const project = await validateProject(db, projectId!);
  const { refererDomain } = validateReferer(event);

  validateDomain(project, refererDomain);

  return project;
});
```

## Step 8: sessions without third-party cookies

Here's the one that ruins weekends. Your widget runs in an iframe on `customer.com`, so a cookie set by `yourdomain.com` is a third-party cookie. Safari's ITP blocks it outright, Firefox partitions it, and Chrome is somewhere in the middle depending on the week.

The fix is to issue the session as a cookie *and* mirror it in a header the iframe can read and send back. h3's `useSession` supports exactly that with `sessionHeader`:

```ts
const session = await useSession(event, {
  password: config.session.password,
  maxAge: 5 * 24 * 60 * 60,
  name: 'embed_session',
  sessionHeader: 'x-embed-session',
});

await session.update({
  chatId: chat.id,
  projectId,
  origin: refererDomain,
} as EmbedSession);

const embedSessionHeader = event.node.res
  .getHeader('set-cookie')!
  .toString()
  .match(/embed_session=(.*?); /)?.[1];

event.node.res.appendHeader('x-embed-session', embedSessionHeader!);
```

The client stores that value and sends it as `x-embed-session` on every subsequent request. The session is a sealed, signed blob, so a header is exactly as safe as the cookie was.

Then bind the session to the domain it was created on, in `server/middleware/embed-auth.ts`:

```ts
const embedSession = session.data as EmbedSession;
const { refererDomain } = validateReferer(event);

if (embedSession?.origin !== refererDomain) {
  throw createError({
    statusCode: 401,
    statusMessage: 'Unauthorized - Invalid referer domain for session',
  });
}
```

Now a session minted on `customer.com` is worthless on `attacker.com`.

## Step 9: rate limiting on Cloudflare KV

Public endpoints that call an LLM need a hard ceiling before launch, not after the first surprise invoice. Workers KV is a decent fit: cheap, global, and TTL-based so entries clean themselves up.

```ts
export async function checkRateLimit(event: H3Event, config: RateLimitConfig) {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown';
  const key = `${config.keyPrefix}:${ip}`;
  const now = Date.now();

  const data = await kv.get<{ count: number; resetAt: number }>(key);

  if (!data || data.resetAt < now) {
    const resetAt = now + config.windowMs;
    await kv.set(key, { count: 1, resetAt }, { ttl: Math.ceil(config.windowMs / 1000) });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt };
  }

  if (data.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: data.resetAt };
  }

  await kv.set(key, { count: data.count + 1, resetAt: data.resetAt }, { ttl: Math.ceil(config.windowMs / 1000) });
  return { allowed: true, remaining: config.maxRequests - data.count - 1, resetAt: data.resetAt };
}
```

Two different limits work well in practice: something like 5 new chat sessions per IP per 10 minutes, and 10 messages per 2 minutes inside a session. Fail open if KV itself errors, because a KV blip shouldn't take every customer's chat offline.

Layer a per-plan monthly cap on top so a single project can't blow through your model budget:

```ts
const maxReplies = PLANS_CONSTANTS[project.planName]?.MAX_NB_OF_AI_REPLIES || 0;
const repliesThisMonth = await getRepliesThisMonth(db, projectId);

if (repliesThisMonth >= maxReplies) {
  throw createError({
    statusCode: 429,
    statusMessage: 'Chatbot is currently unavailable. Please contact the site owner.',
  });
}
```

## Things that will bite you

**CSP on the host site.** The most common install failure by far. Give customers the exact directives to add: `frame-src https://yourdomain.com` and `script-src https://yourdomain.com`.

**Caching embed.js.** It's the one file you can't version, since the snippet is already pasted on a thousand sites. Serve it with a short max-age (a few minutes) and never with `immutable`. Your hashed Nuxt assets under `/_nuxt/**` can stay cached for a year.

**Mobile keyboards.** Use `h-dvh` and not `h-screen` inside the iframe. `vh` units don't account for the browser chrome on iOS and your input ends up under the fold.

**Prompt injection.** Anything a visitor types goes into a model that may also be reading your customer's documents. Validate messages and sanitize responses. It's the same problem I hit on the [RAG side](/blog/how-to-build-ai-chatbot-with-rag-nuxt-4).

**Accessibility.** `role="dialog"`, `aria-label` on the button, and toggling `aria-hidden` on the container. Screen reader users on your customer's site are your customer's users, and a bubble that announces nothing is a complaint waiting to happen.

## Or skip the plumbing

Add up the pieces: loader script, iframe lifecycle, responsive sizing, per-tenant theming, domain whitelisting, header-based sessions, KV rate limiting, plan quotas, plus a dashboard where customers configure all of it. That's a couple of weeks of work before you've written a single line of your actual product.

[NuxtBeyond](/#pricing) ships all of it. The embeddable widget, multi-tenant projects, RAG-powered chat on Cloudflare AI Search, auth, and billing on [Stripe or Polar](/blog/stripe-vs-polar-which-to-choose). It's :launch-price one-time with lifetime updates, and as far as I know it's still the only Nuxt boilerplate with an embeddable widget in the box (I checked all of them for the [boilerplate comparison](/blog/best-nuxt-boilerplates-compared), and the closest alternative is [Supastarter at $349](/blog/supastarter-vs-nuxtbeyond) without one).

Either way, build the widget. The distribution model is worth it: your customers put your product on their sites, and every visitor who opens that bubble is someone who found you through them.

---

*Questions or a correction? [Find me on X](https://x.com/Raress96_).*
