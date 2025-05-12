# @heymp/scratchpad

## 1.0.0-next.15

### Minor Changes

- 2f0fffb: Add new generate commands

  **Generate document**

  Fetch HTML source of url and save it to a local file. This is helpful when using the `rerouteDocument` command.

  ```bash
  npx @heymp/scratchpad@next generate document https://www.example.com pages
  ```

  **Generate login**

  Launch a new browser that saves your session so it can be reused.

  ```bash
  npx @heymp/scratchpad@next generate login
  ```

  You can then reuse the session by using the `login` option when using the `run` command.

  ```bash
  npx @heymp/scratchpad@next run --login
  ```

## 1.0.0-next.14

### Minor Changes

- 71270e1: Add config and playwright rerouting helpers

  Export `defineConfig`, `rerouteUrl`, `rerouteDocument`.

  Example:

  ```ts
  import * as Scratchpad from "@heymp/scratchpad";

  export default Scratchpad.defineConfig({
    devtools: true,
    url: "https://www.redhat.com/en",
    playwright: async (args) => {
      const { page } = args;
      await Scratchpad.rerouteDocument(page, "./pages");
      await Scratchpad.rerouteUrl(page, {
        type: "path",
        target: "**/rh-cta/rh-cta.js",
        source: "./rh-cta.js",
      });
    },
  });
  ```

## 1.0.0-next.13

### Minor Changes

- 21f3bed: Add global readFile method

  Example

  ```js
  await readFile("./log.txt", "utf8");
  ```

## 1.0.0-next.12

### Patch Changes

- 541383a: Fix: logging undefined breaks log output

  fixes: #58

## 1.0.0-next.11

### Minor Changes

- 708f25e: Support ts config files

  `scratchpad.config.ts`

  ```ts
  import { Config } from "@heymp/scratchpad/src/config.js";

  export function hi(name: string) {
    console.log(`Hi there ${name}`);
  }

  declare global {
    interface Window {
      hi: typeof hi;
    }
  }

  export default {
    playwright: async (args) => {
      const { context } = args;
      await context.exposeFunction("hi", hi);
    },
  } satisfies Config;
  ```

  `test.ts`

  ```.ts
  /// <reference path="./scratchpad.config.ts" />

  window.hi('Bob');
  ```

## 1.0.0-next.10

### Patch Changes

- e628851: Fix cannot find package '@commander-js/extra-typings error.

## 1.0.0-next.9

### Patch Changes

- 556669b: Update Readme

## 1.0.0-next.8

### Major Changes

- 4aa2817: Add `generate config` command [#38](https://github.com/heyMP/scratchpad/issues/38)

  ```bash
  npx @heymp/scratchpad generate --help

  Usage: scratchpad generate [options] [command]

  Generate files from templates.

  Options:
    -h, --help      display help for command

  Commands:
    config          Generates an example config file.
    help [command]  display help for command
  ```

- 4aa2817: Add `run` command

  ```bash
  npx @heymp/scratchpad run --help

  Usage: cli run [options] <file>

  Execute a file in a browser.

  Arguments:
    file                  file to execute in the browser.

  Options:
    --headless [boolean]  specify running the browser in headless
                          mode.
    --devtools [boolean]  open browser devtools automatically.
    --ts-write [boolean]  write the js output of the target ts file.
    --url [string]        specify a specific url to execute the code
                          in.
    -h, --help            display help for command
  ```

### Minor Changes

- ea5b50d: Add `writeFile`, `appendFile` exposed functions. (#44)[https://github.com/heyMP/scratchpad/issues/44]

  ```.js
  await writeFile('./log.txt', 'hello');
  await appendFile('./log.txt', '\n');
  await appendFile('./log.txt', 'world');
  ```

  Include custom exposed functions example.

  ```.js
  import { join } from 'node:path'
  import fs from 'node:fs/promises';

  function loadFile(path) {
    return fs.readFile(join(process.cwd(), path), 'utf8');
  }

  export default /** @type {import('@heymp/scratchpad/src/config').Config} */ ({
    playwright: async (args) => {
      const { context, page } = args;
      await context.exposeFunction('loadFile', loadFile)
    }
  });
  ```

- a242c0f: ⚠️ Change config types directory.

  ```js
  export default /** @type {import('@heymp/scratchpad/src/config').Config} */ ({});
  ```

## 1.0.0-next.7

### Minor Changes

- c31a8f9: Expose Playwright runtime context to scratchpad.config.js [#40](https://github.com/heyMP/scratchpad/issues/40)

  `scratchpad.config.js`

  ```js
  export default /** @type {import('@heymp/scratchpad/config').Config} */ ({
    devtools: true,
    playwright: async (args) => {
      const { context, page } = args;
      // block esmodule shims
      await context.route(/es-module-shims\.js/, async (route) => {
        await route.abort();
      });
      await page.goto("https://ux.redhat.com");
    },
  });
  ```

- f6fb1f2: Add option for writing the js output to a file based on the compiled
  ts target. Use `--ts-write` as a boolean flag in the cli.

### Patch Changes

- c31a8f9: Add typings for scratchpad.config.js [#37](https://github.com/heyMP/scratchpad/issues/37)

  ```js
  export default /** @type {import('@heymp/scratchpad/config').Config} */ ({
    devtools: true,
    headless: true,
    url: "https://google.com",
  });
  ```

## 1.0.0-next.6

### Minor Changes

- 2bcb56e: Add `scratchpad.config.js` file as an alternative to specifying scratchpad options
  using the CLI flags.

  ```js
  export default {
    devtools: true,
    headless: false,
    url: "https://www.google.com",
  };
  ```

  NOTE: CLI flags will take precidence over config file options.

## 1.0.0-next.5

### Minor Changes

- db0f2af: Open devtools automatically with cli flag. Use the `--devtools` flag
  to enable the devtools in the browser.

## 1.0.0-next.4

### Minor Changes

- 7b6410e: Migrate from tsc to esbuild for TS compilation

## 1.0.0-next.3

### Major Changes

- f5c9bc4: Migrate to Playwright

## 1.0.0-next.2

### Patch Changes

- 68ec5fb: Fix bin entrypoint

## 1.0.0-next.1

### Patch Changes

- 8883144: Fix log arguments typings

## 1.0.0-next.0

### Major Changes

- 79b0eda: Typescript Support

  Compiles files ending in `.ts` using tsc.

  Example:

  ```bash
  npm install @heymp/scratchpad
  ```

  Recommended tsconfig.json settings.

  ```json
  {
    "target": "esnext",
    "compilerOptions": {
      "types": ["./node_modules/@heymp/scratchpad/types.d.ts"]
    }
  }
  ```
