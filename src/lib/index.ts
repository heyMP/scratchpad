import { readFile } from 'node:fs/promises';
import fs from 'node:fs';
import { extname, join, basename } from 'node:path';
import type { Page } from 'playwright';
import type { RerouteUrlParams } from './types.js';
import { Config } from '../config.js';
import type { PathLike } from 'node:fs';

/**
 * Defines the configuration for the application.
 * This function simply returns the configuration object passed to it,
 * often used for type-checking and providing a clear entry point for configuration.
 * @param {Config} config - The configuration object.
 * @returns {Config} The configuration object.
 */
export function defineConfig(config: Config) {
  return config;
}

/**
 * Reroutes requests to local files within a specified directory. If the file exists locally,
 * the contents of the local file with be used.
 * @async
 * @param {Page} context - The Playwright Page object to apply the rerouting to.
 * @param {string} dir - The root directory where the local page or file (e.g., 'about/index.html', 'assets/script.js') are stored.
 * @returns {Promise<void>} A promise that resolves when the routing has been set up.
 */
export async function rerouteLocal(context: Page, dir: string) {
  // reload the page if the document has been changed
  const watchCallback = () => {
    context.reload();
  }

  await context.route('**', async route => {
    const resourceType = route.request().resourceType();
    const url = new URL(route.request().url())
    const basepath = resourceType === 'document'
      ? !extname(url.pathname)
        ? join(url.pathname, 'index.html')
        : url.pathname
      : basename(url.pathname);
    const pagePath = join(dir, basepath);

    const content = await readFile(join(process.cwd(), pagePath), 'utf8')
      .catch(() => null);

    // watch the file for changes
    watchFile(pagePath, watchCallback);

    if (content) {
      const response = await route.fetch();
      await route.fulfill({
        response,
        body: content
      });
      console.log(`\x1b[33m 🚸 Page override:\x1b[0m ${pagePath}`);
    } else {
      await route.fallback();
    }
  });
}

/**
 * @deprecated Use rerouteLocal
 *
 * Reroutes document requests to local files within a specified directory.
 * It intercepts 'document' type requests and attempts to serve a corresponding
 * 'index.html' file from the local file system. It also watches the local file
 * for changes and reloads the page if a change is detected.
 * @async
 * @param {Page} context - The Playwright Page object to apply the rerouting to.
 * @param {string} dir - The root directory where the local page files (e.g., 'about/index.html') are stored.
 * @returns {Promise<void>} A promise that resolves when the routing has been set up.
 */
export async function rerouteDocument(context: Page, dir: string) {
  // reload the page if the document has been changed
  const watchCallback = () => {
    context.reload();
  }

  await context.route('**', async route => {
    const resourceType = route.request().resourceType();
    if (resourceType !== 'document') {
      await route.fallback();
      return;
    }
    const url = new URL(route.request().url())
    const basepath = !extname(url.pathname)
      ? join(url.pathname, 'index.html')
      : url.pathname;
    const pagePath = join(dir, basepath);

    // watch file for changes
    watchFile(pagePath, watchCallback);

    const content = await readFile(join(process.cwd(), pagePath), 'utf8')
      .catch(() => null);

    if (content) {
      const response = await route.fetch();
      await route.fulfill({
        response,
        body: content
      });
      console.log(`\x1b[33m 🚸 Page override:\x1b[0m ${pagePath}`);
    } else {
      await route.fallback();
    }
  });
}

/**
 * Reroutes network requests for a given Playwright Page context.
 * It can reroute a target URL to another URL or to a local file path.
 * If rerouting to a local file path, it watches the file for changes and
 * reloads the page if the file is modified.
 * @async
 * @param {Page} context - The Playwright Page object to apply the rerouting to.
 * @param {RerouteUrlParams} options - An object containing the rerouting parameters.
 * @param {('url' | 'path')} options.type - The type of rerouting: 'url' to reroute to another URL,
 * 'path' to reroute to a local file.
 * @param {string | RegExp} options.target - The URL or pattern to intercept and reroute.
 * @param {string} options.source - The source URL or local file path to reroute to.
 * @returns {Promise<void>} A promise that resolves when the routing has been set up.
 */
export async function rerouteUrl(context: Page, options: RerouteUrlParams) {
  const { type, target, source } = options;
  // reload the page if the document has been changed
  const watchCallback = () => {
    context.reload();
  }

  if (type === 'url') {
    await context.route(target, async route => {
      const response = await route.fetch({
        url: source,
      });
      await route.fulfill({ response })
      console.log(`\x1b[33m 🚸 Reroute url:\x1b[0m ${target} → ${source}`);
    });
    return;
  }
  if (type === 'path') {
    const path = join(process.cwd(), source);

    // watch the file for changes
    watchFile(path, watchCallback);

    await context.route(target, async route => {
      const file = await readFile(path, 'utf8')
        .catch(() => null);
      if (!file) {
        console.warn(`\x1b[33m ⚠️ Could not read file for reroute:\x1b[0m ${path}`);
        await route.abort(); // Abort the request if the file is not found
        return;
      }

      const response = await route.fetch(); // Fetch original to get headers, status etc. if needed
      await route.fulfill({
        body: file,
        response // Pass the original response to inherit headers, status (unless overridden)
      });
      console.log(`\x1b[33m 🚸 Reroute url:\x1b[0m ${target} → ${source}`);
    });
  }
}

/**
 * Watches a file for changes and executes a callback function when the file is modified.
 * It ensures that a file is not watched multiple times by attempting to unwatch it first.
 * Handles cases where the file might not exist.
 * @async
 * @param {PathLike} path - The path to the file to watch.
 * @param {() => void} callback - The function to call when the file changes.
 * @returns {Promise<void>} A promise that resolves when the file watching is set up or if an error occurs during setup.
 * It does not wait for file changes themselves.
 */
async function watchFile(path: PathLike, callback: () => void): Promise<void> {
  try {
    // Check if file exists first
    if (!fs.existsSync(path)) {
      return;
    }

    // Try to unwatch, but don't throw if it fails
    try {
      fs.unwatchFile(path, callback);
    } catch (e) {
      // Ignore unwatch errors, e.g., if the file was not previously watched with the same callback
    }

    // Set up new watch
    fs.watchFile(path, { interval: 100 }, callback);
  } catch (e: unknown) {
    console.error(`watchFile: Failed to watch file ${path.toString()}:`, e);
  }
}
