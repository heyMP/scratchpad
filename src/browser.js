import playwright from 'playwright';
import util from 'node:util';
util.inspect.defaultOptions.maxArrayLength = null;
util.inspect.defaultOptions.depth = null;

function format(value) {
  if (value instanceof Map) {
    ret = Array.from(value.entries())
  } else {
    ret = value;
  }
  console.log(ret);
}

function nodelog(value) {
  console.log(value);
}

export async function browser(processor) {
  // Launch the browser
  const browser = await playwright['chromium'].launch({
    headless: !!processor.headless,
    devtools: !!processor.devtools
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Create a page
  if (processor.url) {
    await page.goto(processor.url);
  }

  await page.exposeFunction('clear', () => {
    console.clear();
    page.evaluate(() => {
      console.clear()
    });
  });

  await page.exposeFunction('nodelog', (...value) => {
    console.log(...value);
  });

  async function execute() {
    page.evaluate(async (func) => {
      function log(...value) {
        setTimeout(() => {
          console.log(...value);
        }, 100);
        nodelog(
          ...value.flatMap(i => {
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
      } catch (Error) {
        log(Error.toString())
      }
    },
      processor.func
    );
  }

  // Evaluate JavaScript
  processor.addEventListener('change', execute);
  processor.start();
}

