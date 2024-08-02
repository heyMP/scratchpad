import type { Page, BrowserContext, Browser } from 'playwright';

export type PlaywrightConfig = {
  page: Page,
  context: BrowserContext,
  browser: Browser,
}

export type Config = {
  headless?: boolean;
  devtools?: boolean;
  tsWrite?: boolean;
  url?: string;
  playwright?: (page: PlaywrightConfig) => Promise<void>
}
