/// <reference lib="dom" />
import { z } from 'zod';
import { H3Error } from 'h3';
import type { Page } from '@cloudflare/puppeteer';
import { blob } from 'hub:blob'
import { hubBrowser } from '~~/server/utils/browser';

const bodySchema = z.object({
  url: z.url('Please enter a valid URL'),
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
      name = document.querySelector('h1')?.textContent.trim();
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
      'link[rel="icon"][sizes="192x192"]', // <-- Prioritize this in the selector list
      'link[rel="apple-touch-icon"]',
      'link[rel="icon"]',
      'link[rel="shortcut icon"]',
    ].join(', ');

    const links = Array.from(document.querySelectorAll(iconSelectors));

    // Define the custom prioritization logic
    const bestLink = links.sort((a, b) => {
      const aSizes = a.getAttribute('sizes');
      const bSizes = b.getAttribute('sizes');
      const aRel = a.getAttribute('rel');
      const bRel = b.getAttribute('rel');

      // PRIORITY 1: 192x192 sizes attribute
      const isA192 = aSizes === '192x192';
      const isB192 = bSizes === '192x192';

      if (isA192 && !isB192) {
        return -1;
      } // A wins
      if (!isA192 && isB192) {
        return 1;
      } // B wins
      if (isA192 && isB192) {
        return 0;
      } // Equal priority, maintain order

      // PRIORITY 2 (Fallback): apple-touch-icon
      const isAApple = aRel === 'apple-touch-icon';
      const isBApple = bRel === 'apple-touch-icon';

      if (isAApple && !isBApple) return -1; // A wins
      if (!isAApple && isBApple) return 1; // B wins

      // PRIORITY 3 (Fallback): General icon or shortcut icon
      return 0;
    })[0];

    if (bestLink) {
      const href = bestLink.getAttribute('href');

      // Convert relative URL to absolute URL
      if (href && !href.startsWith('http')) {
        return new URL(href, baseUrl).href;
      }
      return href;
    }

    // Fallback: If no link tag found, assume a default path for favicon
    return `${baseUrl}favicon.ico`;
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

  // Verify Turnstile token
  const turnstileResponse = await verifyTurnstileToken(turnstileToken);
  if (!turnstileResponse.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid captcha. Please try again.',
    });
  }

  try {
    // Sanitize URL for filename
    const newUrl = new URL(url);
    const cleanPathname = newUrl.pathname.replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
    const sanitizedFilename = cleanPathname
      ? `${newUrl.host}_${cleanPathname}`.replace(/[^a-zA-Z0-9.-]/g, '_')
      : newUrl.host;
    const fileName = `${Date.now()}-${sanitizedFilename}.html`;

    // Fetch webpage content
    const { page } = await hubBrowser(event, {
      keepAlive: 60, // 60 seconds
    });

    await page.goto(url);

    const appName = await getAppName(page);
    const appIcon = await getAppIcon(page, url);

    console.log('App Name', appName);
    console.log('App Icon', appIcon);

    const htmlPage = await page.content();

    // Store the content in blob storage with resource prefix
    await blob.put(fileName, htmlPage, {
      prefix: `resources/free-ai-chatbot-generator`,
      contentType: 'text/html',
      customMetadata: {
        originalUrl: url,
        resourceType: 'free-ai-chatbot-generator',
        appName: appName ?? '',
        appIcon: appIcon ?? '',
      },
    });

    // Trigger AutoRAG sync
    const result = await syncAutoRAG(process.env.CLOUDFLARE_AUTO_RAG_ID!);
    const json = await result.json();
    console.log(`Requested syncing of AutoRAG for resource/free-ai-chatbot-generator/${fileName}:`, json);

    const jobId = json.result?.job_id;

    if (jobId) {
      // Also store jobId
      await blob.put(fileName, htmlPage, {
        prefix: `resources/free-ai-chatbot-generator`,
        contentType: 'text/html',
        customMetadata: {
          originalUrl: url,
          resourceType: 'free-ai-chatbot-generator',
          appName: appName ?? '',
          appIcon: appIcon ?? '',
          jobId,
        },
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
