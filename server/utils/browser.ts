import cfPuppeteer from '@cloudflare/puppeteer';
import type { Browser, Page, BrowserWorker, ActiveSession, PuppeteerWorkers } from '@cloudflare/puppeteer';
import { createError } from 'h3';
import type { H3Event } from 'h3';

function getBrowserBinding(name: string = 'BROWSER'): BrowserWorker | undefined {
  // @ts-expect-error globalThis.__env__ is not typed
  return process.env[name] || globalThis.__env__?.[name] || globalThis[name];
}

interface HubBrowserOptions {
  /**
   * Keep the browser instance alive for the given number of seconds.
   * Maximum value is 600 seconds (10 minutes).
   *
   * @default 60
   */
  keepAlive?: number;
}

interface HubBrowser {
  browser: Browser;
  page: Page;
}

/**
 * Get a browser instance (puppeteer)
 *
 * @example ```ts
 * const { page } = await hubBrowser(event)
 * await page.goto('https://hub.nuxt.com')
 * const img = await page.screenshot()
 * ```
 *
 * @see https://developers.cloudflare.com/browser-rendering/
 */
export async function hubBrowser(event: H3Event, options: HubBrowserOptions = {}): Promise<HubBrowser> {
  const nitroApp = useNitroApp();

  const binding = getBrowserBinding();
  if (!binding) {
    throw createError('Missing Cloudflare Browser binding (BROWSER)');
  }

  let browser: Browser | null = null;
  const sessionId = await getRandomSession(cfPuppeteer, binding);

  if (sessionId) {
    try {
      browser = await cfPuppeteer.connect(binding, sessionId);
    } catch (_) {
      // another worker may have connected first
    }
  }

  if (!browser) {
    browser = await cfPuppeteer.launch(binding, {
      keep_alive: (options.keepAlive || 60) * 1000,
    });
  }

  const page = await browser.newPage();

  const unregister = nitroApp.hooks.hook('afterResponse', async (closingEvent: H3Event) => {
    if (event !== closingEvent) return;
    unregister();
    await page?.close().catch(() => {});
    browser?.disconnect();
  });

  return {
    browser,
    page,
  };
}

async function getRandomSession(puppeteer: PuppeteerWorkers, binding: BrowserWorker): Promise<string | null> {
  const sessions: ActiveSession[] = await puppeteer.sessions(binding);
  const sessionsIds = sessions
    // remove sessions with workers connected to them
    .filter((v) => !v.connectionId)
    .map((v) => v.sessionId);

  if (!sessionsIds.length) {
    return null;
  }

  return sessionsIds[Math.floor(Math.random() * sessionsIds.length)] ?? null;
}
