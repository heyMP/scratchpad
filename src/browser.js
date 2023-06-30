import puppeteer from 'puppeteer';

export async function browser(processor, { headless = false }) {
  // Launch the browser
  const browser = await puppeteer.launch({ headless });

  // Create a page
  const page = await browser.newPage();

  // Evaluate JavaScript
  processor.addEventListener('change', async () => {
    const result = await page.evaluate((func) => {
      try {
        return eval(func);
      } catch (Error) {
        console.log(Error);
        return Error.toString();
      }
    }, processor.func);
    console.log(result);
  });

  processor.start();

  // Close browser.
  if (headless !== false) {
    await browser.close();
  }
}
