import { Command } from '@commander-js/extra-typings';
import { getConfig } from './config.js';
import { Processor } from './Processor.js';
import { browser } from './browser.js';
import { parseBooleanOption, pickSession } from './utils.js';

async function resolveSessionName(
  cliSession: string | true | undefined,
  configSession: string | true | undefined,
) {
  if (typeof cliSession === 'string') {
    return cliSession;
  }
  if (cliSession === true) {
    return pickSession();
  }
  if (typeof configSession === 'string') {
    return configSession;
  }
  if (configSession === true) {
    return pickSession();
  }
  return undefined;
}

export const runCommand = new Command('run')
  .description('Execute a file in a browser.')
  .argument('[file]', 'file to execute in the browser.')
  .option('--headless [boolean]', 'specify running the browser in headless mode.')
  .option('--devtools [boolean]', 'open browser devtools automatically.')
  .option('--ts-write [boolean]', 'write the js output of the target ts file.')
  .option('--url [string]', 'specify a specific url to execute the code in.')
  .option('--session [name]', 'use a saved browser session by name, or pick one interactively')
  .action(async (file, options) => {
    const config = await getConfig();
    const opts = { ...config, ...options };
    const session = await resolveSessionName(opts['session'], config.session);
    const processor = new Processor({
      // type narrow the options
      ...(opts['headless'] !== undefined && { headless: parseBooleanOption(opts['headless']) }),
      ...(opts['devtools'] !== undefined && { devtools: parseBooleanOption(opts['devtools']) }),
      ...(opts['tsWrite'] !== undefined && { tsWrite: parseBooleanOption(opts['tsWrite']) }),
      url: typeof opts['url'] === 'string' ? opts['url'] : undefined,
      playwright: opts['playwright'],
      session,
      rerouteDir: opts['rerouteDir'],
      bypassCSP: opts['bypassCSP'],
      launchOptions: opts['launchOptions'],
      file: file
    });
    browser(processor);
  });
