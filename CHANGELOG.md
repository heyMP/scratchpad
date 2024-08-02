# @heymp/scratchpad

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
