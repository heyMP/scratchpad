import playwright from 'playwright';
import util from 'node:util';
import { readFile } from 'node:fs/promises';
import type { Config } from './config.js';
import {
  ensureSessionsDir,
  generateDefaultSessionName,
  getSessionPath,
  promptForSessionName,
} from './utils.js';
util.inspect.defaultOptions.maxArrayLength = null;
util.inspect.defaultOptions.depth = null;

export async function login(config: Config) {
  await ensureSessionsDir();

  const sessionName = config.sessionName
    ?? await promptForSessionName(await generateDefaultSessionName());
  const sessionPath = getSessionPath(sessionName);

  const browser = await playwright['chromium'].launch({
    headless: false,
    args: config.devtools ? ['--auto-open-devtools-for-tabs'] : [],
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  if (config.url) {
    await page.goto(config.url);
  }

  page.on('close', async () => {
    await page.context().storageState({ path: sessionPath });
    await browser.close();
    console.log(`\x1b[33m 👻 Session saved as "${sessionName}"\x1b[0m`);
  });
}

export async function getSession(name: string) {
  const filePath = getSessionPath(name);
  const sessionFile = await readFile(filePath, 'utf8');
  return sessionFile ? JSON.parse(sessionFile) : undefined;
}
