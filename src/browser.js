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

export async function browser(processor) {
  // Launch the browser
  const browser = await puppeteer.launch({ headless: false, devtools: true });

  // Create a page
  const page = await browser.newPage();
  if (processor.url) {
    await page.goto(processor.url);
  }

  // Evaluate JavaScript
  processor.addEventListener('change', async () => {
    const result = await page.evaluate((func) => {
      try {
        const value = eval(func);
        if (value instanceof Map || value instanceof Set) {
          return Array.from(value.entries())
        }
        else {
          return value;
        }
      } catch (Error) {
        console.log(Error);
        return Error.toString();
      }
    },
      processor.func
    );
    console.clear();
    console.log(result);
  });

  processor.start();
}

function replacer(key, value) {
}
