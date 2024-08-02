import { join } from 'node:path';
import { stat } from 'node:fs/promises';
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

const exists = (path:string) => stat(path).then(() => true, () => false);

async function importConfig(rootDir:string) {
  const path = join(rootDir, './scratchpad.config.js');
  if (await exists(path)) {
    return import(path)
      .then(x => x.default)
      .catch(e => {
        console.error(e);
        return {};
      });
  } else {
    return {};
  }
}

export async function getConfig() {
  const rootDir = process.cwd();
  return {
    ...await importConfig(rootDir),
  }
}

