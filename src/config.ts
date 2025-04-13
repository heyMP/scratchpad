import { join } from 'node:path';
import type { Page, BrowserContext, Browser } from 'playwright';
import { build } from 'esbuild';
import { exists, esm } from './utils.js';

export type PlaywrightConfig = {
  page: Page,
  context: BrowserContext,
  browser: Browser,
}

export type Config = {
  headless?: boolean;
  devtools?: boolean;
  tsWrite?: boolean;
  url?: string;
  playwright?: (page: PlaywrightConfig) => Promise<void>
}

/**
 * Looks at the users root path to see if there
 * are any valid config files.
 * @returns either the absolute path to the valid config
 *          or returns false if none have config
 *          has not been found.
 */
async function getConfigPath(): Promise<string | false> {
  if (await exists(join(process.cwd(), 'scratchpad.config.js'))) {
    return join(process.cwd(), 'scratchpad.config.js');
  }
  if (await exists(join(process.cwd(), 'scratchpad.config.ts'))) {
    return join(process.cwd(), 'scratchpad.config.ts');
  }
  return false;
}

/**
 * Get the import config object from the config file.
 */
async function importConfig(): Promise<Partial<Config>> {
  // determine if there are any valid configs
  const configPath = await getConfigPath();

  // if there is no config path then return
  // an empty object
  if (!configPath) {
    return {}
  }

  try {
    // use esbuild to load the .js or .ts file
    const { outputFiles: [stdout] } = await build({
      entryPoints: [configPath],
      format: 'esm',
      bundle: true,
      write: false,
      platform: 'node'
    });
    const contents = new TextDecoder().decode(stdout.contents);
    const module = await import(esm`${contents}`);
    return module.default ?? {};
  } catch (e) {
    console.error(`An error occured parsing config file.${configPath}`);
    console.error(``);
    console.error(`Path: ${configPath}`);
    console.error(``);
    throw e;
  }
}

export async function getConfig(): Promise<Config> {
  return {
    ...await importConfig(),
  }
}

