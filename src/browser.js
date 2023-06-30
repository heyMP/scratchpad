import puppeteer from 'puppeteer';

export async function browser(func, { headless = false }) {
  // Launch the browser
  const browser = await puppeteer.launch({ headless });

  // Create a page
  const page = await browser.newPage();

  // Evaluate JavaScript
  const result = await page.evaluate((func) => {
    return eval(func);
  }, func);

  console.log(result);
  
  // Close browser.
  if (headless !== false) {
    await browser.close();
  }
}
