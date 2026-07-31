import playwright from 'playwright';
import type { Browser, BrowserContext, LaunchOptions } from 'playwright';
import util from 'node:util';
import { join } from 'node:path'
import fs from 'node:fs/promises';
import type { Processor, ProcessorOpts } from './Processor.js';
import { getSession, saveSessionFromContext } from './login.js';
import { OperationCancelledError, findAvailableDebugPort, getCdpWebSocketUrl } from './utils.js';
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

function stripDebugLaunchArgs(args: string[]): string[] {
  return args.filter(
    (arg) => !arg.startsWith('--remote-debugging-port=') && arg !== '--remote-allow-origins=*',
  );
}

export function buildLaunchOptions(opts: ProcessorOpts, debugPort?: number): LaunchOptions {
  const bypassCSPArgs = opts.bypassCSP ? ['--disable-web-security'] : [];
  const devtoolsArgs = opts.devtools ? ['--auto-open-devtools-for-tabs'] : [];
  const debugArgs = debugPort
    ? [`--remote-debugging-port=${debugPort}`, '--remote-allow-origins=*']
    : [];
  const launchArgs = opts.launchOptions?.args ?? [];
  const userArgs = debugPort ? stripDebugLaunchArgs(launchArgs) : launchArgs;
  const headless = opts.devtools
    ? false
    : opts.headless !== undefined
      ? !!opts.headless
      : opts.launchOptions?.headless;
  return {
    ...opts.launchOptions,
    ...(headless !== undefined && { headless }),
    args: [...bypassCSPArgs, ...devtoolsArgs, ...debugArgs, ...userArgs],
  };
}

function restoreStdin() {
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
    process.stdin.pause();
  }
}

function setupKeypressListener(context: BrowserContext, browser: Browser) {
  if (!process.stdin.isTTY) {
    return;
  }

  let saving = false;

  const cleanup = () => {
    restoreStdin();
  };

  browser.on('disconnected', cleanup);

  process.stdin.setRawMode(true);
  process.stdin.resume();
  console.log('Press \'s\' to save session');

  process.stdin.on('data', async (key) => {
    if (key[0] === 3) {
      cleanup();
      await browser.close();
      process.exit(0);
    }

    if (key.toString() !== 's' || saving) {
      return;
    }

    saving = true;
    process.stdin.setRawMode(false);
    process.stdin.pause();

    try {
      await saveSessionFromContext(context);
    } catch (error) {
      if (!(error instanceof OperationCancelledError)) {
        console.error(error);
      }
    } finally {
      saving = false;
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
        process.stdin.resume();
      }
    }
  });
}

export async function browser(processor: Processor) {
  // Resolve debug port if debugging is enabled
  let debugPort: number | undefined;
  if (processor.opts.debug) {
    const preferredPort = typeof processor.opts.debug === 'number'
      ? processor.opts.debug
      : undefined;
    debugPort = await findAvailableDebugPort(preferredPort);
  }

  // Launch the browser
  const browser = await playwright['chromium'].launch(buildLaunchOptions(processor.opts, debugPort));
  const context = await browser.newContext({
    storageState: processor.opts.session ? await getSession(processor.opts.session) : undefined,
    bypassCSP: processor.opts.bypassCSP,
  });
  const page = await context.newPage();
  const playwrightConfig = processor.opts.playwright;

  if (debugPort) {
    const wsUrl = await getCdpWebSocketUrl(debugPort);
    if (wsUrl) {
      console.log(`CDP endpoint: ${wsUrl}`);
    } else {
      console.log(`CDP endpoint: http://127.0.0.1:${debugPort}/json/version`);
    }
  }

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
  setupKeypressListener(context, browser);
}

