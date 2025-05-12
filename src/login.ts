import playwright from 'playwright';
import util from 'node:util';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { exists } from './utils.js';
import type { Config } from './config.js';
util.inspect.defaultOptions.maxArrayLength = null;
util.inspect.defaultOptions.depth = null;

export async function login(config: Config) {
  const browser = await playwright['chromium'].launch({
    headless: false,
    devtools: !!config.devtools
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Create a page
  if (config.url) {
    await page.goto(config.url);
  }

  page.on('close', async () => {
    await page.context().storageState({ path: '.scratchpad/login.json' });
    await browser.close();
    console.log(`\x1b[33m 👻 Session saved\x1b[0m`);
  });
}

export async function getSession(path: string): Promise<string | undefined> {
  const filePath = join(process.cwd(), path);
  const fileExists = await exists(filePath);
  if (!fileExists) {
    return undefined;
  }
  const sessionFile = await readFile(filePath, 'utf8');
  const session = sessionFile ? JSON.parse(sessionFile) : undefined;
  return session;
}
