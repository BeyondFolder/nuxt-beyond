/// <reference lib="dom" />
import { z } from 'zod';
import { H3Error } from 'h3';
import type { Page } from '@cloudflare/puppeteer';
import { blob } from 'hub:blob';
import { hubBrowser } from '~~/server/utils/browser';

const bodySchema = z.object({
  url: z.url({ protocol: /^https?$/, error: 'Please enter a valid http(s) URL' }),
  turnstileToken: z.string(),
});

async function getAppName(page: Page) {
  // Evaluate runs in Puppeteer's context, so we can use DOM APIs directly
  return await page.evaluate(() => {
    let name = document.querySelector('meta[property="og:site_name"]')?.getAttribute('content');

    if (!name) {
      name = document.title;
    }

    if (!name) {
      name = document.querySelector('h1')?.textContent?.trim();
    }

    if (name && name.includes(' - ')) {
      name = name.split(' - ')[0]?.trim();
    }

    return name;
  });
}

async function getAppIcon(page: Page, url: string) {
  return await page.evaluate((baseUrl) => {
    // Select all relevant icon link tags, including the PWA standard 192x192
    const iconSelectors = [
      'link[rel="icon"][sizes="192x192"]',
      'link[rel="apple-touch-icon"]',
      'link[rel="icon"]',
      'link[rel="shortcut icon"]',
    ].join(', ');

    const links = Array.from(document.querySelectorAll(iconSelectors));

    // Prioritize 192x192 icons, then apple-touch-icon, then any other icon
    const bestLink = links.sort((a, b) => {
      const isA192 = a.getAttribute('sizes') === '192x192';
      const isB192 = b.getAttribute('sizes') === '192x192';

      if (isA192 !== isB192) {
        return isA192 ? -1 : 1;
      }
      if (isA192) {
        return 0;
      }

      const isAApple = a.getAttribute('rel') === 'apple-touch-icon';
      const isBApple = b.getAttribute('rel') === 'apple-touch-icon';

      if (isAApple !== isBApple) {
        return isAApple ? -1 : 1;
      }

      return 0;
    })[0];

    const href = bestLink?.getAttribute('href');

    if (href && URL.canParse(href, baseUrl)) {
      const iconUrl = new URL(href, baseUrl);

      if (iconUrl.protocol === 'http:' || iconUrl.protocol === 'https:') {
        return iconUrl.href;
      }
    }

    return new URL('/favicon.ico', baseUrl).href;
  }, url);
}

export default defineEventHandler(async (event) => {
  const rateLimit = await checkRateLimit(event, {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000,
    keyPrefix: 'free-chatbot-gen',
  });

  if (!rateLimit.allowed) {
    const resetDate = new Date(rateLimit.resetAt);
    throw createError({
      statusCode: 429,
      statusMessage: `Too many requests. Please try again after ${resetDate.toLocaleTimeString()}.`,
    });
  }

  const { url, turnstileToken } = await readValidatedBody(event, bodySchema.parse);

  const turnstileResponse = await verifyTurnstileToken(turnstileToken);
  if (!turnstileResponse.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid captcha. Please try again.',
    });
  }

  try {
    const newUrl = new URL(url);
    const cleanPathname = newUrl.pathname.replace(/^\/+|\/+$/g, '');
    const sanitizedFilename = (cleanPathname ? `${newUrl.host}_${cleanPathname}` : newUrl.host)
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .slice(0, 100);
    const fileName = `${Date.now()}-${sanitizedFilename}.html`;

    const { page } = await hubBrowser(event, {
      keepAlive: 60,
    });

    await page.goto(url);

    const appName = await getAppName(page);
    const appIcon = await getAppIcon(page, url);
    const htmlPage = await page.content();

    const customMetadata = {
      originalUrl: url,
      resourceType: 'free-ai-chatbot-generator',
      appName: appName ?? '',
      appIcon,
    };

    await blob.put(fileName, htmlPage, {
      prefix: FREE_AI_CHATBOT_BLOB_PREFIX,
      contentType: 'text/html',
      customMetadata,
    });

    const result = await syncAutoRAG(process.env.CLOUDFLARE_AUTO_RAG_ID!);
    const json = await result.json();
    const jobId = json.result?.job_id;

    if (jobId) {
      await blob.put(fileName, htmlPage, {
        prefix: FREE_AI_CHATBOT_BLOB_PREFIX,
        contentType: 'text/html',
        customMetadata: { ...customMetadata, jobId },
      });
    }

    return {
      fileName,
    };
  } catch (error) {
    console.error('Error processing web page for resources:', error);

    if (error instanceof H3Error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process web page content',
    });
  }
});
