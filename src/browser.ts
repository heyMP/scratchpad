import playwright from 'playwright';
import util from 'node:util';
import { join } from 'node:path'
import fs from 'node:fs/promises';
import type { Processor } from './Processor.js';
import { getSession } from './login.js';
import { rerouteLocal } from './lib/index.js';
util.inspect.defaultOptions.maxArrayLength = null;
util.inspect.defaultOptions.depth = null;

function nodelog(value: any) {
  console.log(value);
}

function writeFile(path: string, data: any) {
  return fs.writeFile(join(process.cwd(), path), data);
}

function appendFile(path: string, data: any) {
  return fs.appendFile(join(process.cwd(), path), data);
}

function readFile(...args: Parameters<typeof fs.readFile>) {
  return fs.readFile(...args);
}

export async function browser(processor: Processor) {
  // Get session login session
  // Launch the browser
  const browser = await playwright['chromium'].launch({
    headless: !!processor.opts.headless,
    devtools: !!processor.opts.devtools,
    args: processor.opts.bypassCSP ? ['--disable-web-security'] : [],
  });
  const context = await browser.newContext({
    storageState: processor.opts.login ? await getSession('.scratchpad/login.json') : undefined,
    bypassCSP: processor.opts.bypassCSP,
  });
  const page = await context.newPage();
  const playwrightConfig = processor.opts.playwright;

  if (processor.opts.rerouteDir) {
    await rerouteLocal(page, processor.opts.rerouteDir);
  }

  // Exposed functions
  await context.exposeFunction('writeFile', writeFile);
  await context.exposeFunction('appendFile', appendFile);
  await context.exposeFunction('readFile', readFile);
  await context.exposeFunction('nodelog', (...value: any) => {
    console.log(...value);
  });
  await context.exposeFunction('clear', () => {
    console.clear();
    page.evaluate(() => {
      console.clear()
    });
  });

  // Allow playwright config override
  if (playwrightConfig && typeof playwrightConfig === 'function') {
    await playwrightConfig({ browser, context, page });
  }

  // Create a page
  if (processor.opts.url) {
    await page.goto(processor.opts.url);
  }

  async function execute() {
    page.evaluate(async (func) => {
      function log(...value: any[]) {
        setTimeout(() => {
          console.log(...value);
        }, 100);
        nodelog(
          // @ts-ignore
          ...value.flatMap((i: any) => {
            const protoName = Object.prototype.toString.call(i);
            const protoNamePrettyPrint = protoName.replace('object ', '').replace(/\[|\]/g, '') + ':';

            if (protoName === '[object Undefined]') {
              return [i];
            }
            if (protoName === '[object Array]') {
              return [protoNamePrettyPrint, i];
            }
            if (protoName === '[object Set]') {
              return [protoNamePrettyPrint, [...i.values()]];
            }
            if (protoName === '[object Map]') {
              return [protoNamePrettyPrint, [...i.entries()]];
            }
            if (protoName === '[object Generator]') {
              return [protoNamePrettyPrint, i.next()];
            }
            if (typeof i[Symbol.iterator] === 'function') {
              if (!['[object String]', '[object Array]'].includes(protoName)) {
                return [protoNamePrettyPrint, [...i]]
              }
            }
            else if (protoName === '[object Function]') {
              return ['ƒ:', i.toString()]
            }
            /**
             * @todo: Promises should pretty print much nicer, like chromium.
             */
            else if (protoName === '[object Promise]') {
              return [protoNamePrettyPrint, i];
            }
            return [protoNamePrettyPrint, i];
          })
        );
      }

      try {
        eval(`
          (async () => {
            try {
              ${func}
            } catch (Error) {
              nodelog(Error.toString());
              throw Error;
            }
          })()
        `);
      } catch (error) {
        if (!(error instanceof Error)) {
          log(`An unkown error has occurred.`);
          return;
        }
        log(error.toString())
      }
    },
      processor.func
    );
  }

  // Evaluate JavaScript
  processor.addEventListener('change', execute);
  processor.start();
}

