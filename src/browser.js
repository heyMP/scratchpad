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
  await page.exposeFunction('nodelog', nodelog);

  // Evaluate JavaScript
  processor.addEventListener('change', async () => {
    page.evaluate(async (func) => {
      function log(value) {
        console.log(value);
        if (value instanceof Map || value instanceof Set) {
          nodelog([...value.entries()]);
        }
        else {
          nodelog(value);
        }
      }

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
    },
      processor.func
    );
  });

  processor.start();
}

