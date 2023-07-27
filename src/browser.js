import puppeteer from 'puppeteer';
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
  const browser = await puppeteer.launch({ headless: processor.headless, devtools: true });

  // Create a page
  const page = await browser.newPage();
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

  // Evaluate JavaScript
  processor.addEventListener('change', async () => {
    page.evaluate(async (func) => {
      function log(...value) {
        setTimeout(() => {
          console.log(...value);
        }, 100);
        nodelog(
          ...value.flatMap(i => {
            const protoName = Object.prototype.toString.call(i);
            if (protoName === '[object Array]') {
              return [i];
            }
            if (protoName === '[object Set]') {
              return [protoName, [...i.values()]];
            }
            else if (protoName === '[object Map]') {
              return [protoName, [...i.entries()]];
            }
            else if (protoName === '[object Generator]') {
              return [protoName, i.next()];
            }
            else if (typeof i[Symbol.iterator] === 'function') {
              if (!['[object String]', '[object Array]'].includes(protoName)) {
                return [protoName, [...i]]
              }
            }
            return i;
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
  });

  processor.start();
}

