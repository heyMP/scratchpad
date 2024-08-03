import playwright from 'playwright';
import util from 'node:util';
import type { Processor } from './Processor.js';
util.inspect.defaultOptions.maxArrayLength = null;
util.inspect.defaultOptions.depth = null;

function nodelog(value:any) {
  console.log(value);
}

export async function browser(processor: Processor) {
  // Launch the browser
  const browser = await playwright['chromium'].launch({
    headless: !!processor.opts.headless,
    devtools: !!processor.opts.devtools
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  const playwrightConfig = processor.opts.playwright;

  // Allow playwright config override
  if (playwrightConfig && typeof playwrightConfig === 'function') {
    await playwrightConfig({ browser, context, page });
  }

  // Create a page
  if (processor.opts.url) {
    await page.goto(processor.opts.url);
  }

  await page.exposeFunction('clear', () => {
    console.clear();
    page.evaluate(() => {
      console.clear()
    });
  });

  await page.exposeFunction('nodelog', (...value: any) => {
    console.log(...value);
  });

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
            if (protoName === '[object Array]') {
              return [protoNamePrettyPrint, i];
            }
            if (protoName === '[object Set]') {
              return [protoNamePrettyPrint, [...i.values()]];
            }
            else if (protoName === '[object Map]') {
              return [protoNamePrettyPrint, [...i.entries()]];
            }
            else if (protoName === '[object Generator]') {
              return [protoNamePrettyPrint, i.next()];
            }
            else if (typeof i[Symbol.iterator] === 'function') {
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

