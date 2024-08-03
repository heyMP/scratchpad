import { Command } from '@commander-js/extra-typings';
import { getConfig } from './config.js';
import { Processor } from './Processor.js';
import { browser } from './browser.js';

export const runCommand = new Command('run')
  .description('Execute a file in a browser.')
  .argument('<file>', 'file to execute in the browser.')
  .option('--headless [boolean]', 'specify running the browser in headless mode.')
  .option('--devtools [boolean]', 'open browser devtools automatically.')
  .option('--ts-write [boolean]', 'write the js output of the target ts file.')
  .option('--url [string]', 'specify a specific url to execute the code in.')
  .action(async (file, options, command) => {
    const config = await getConfig();
    const opts = { ...config, ...options};
    const processor = new Processor({
      // type narrow the options
      headless: !!opts['headless'],
      devtools: !!opts['devtools'],
      tsWrite: !!opts['tsWrite'],
      url: typeof opts['url'] === 'string' ? opts['url'] : undefined,
      playwright: opts['playwright'],
      file,
    });
    browser(processor);
  });
