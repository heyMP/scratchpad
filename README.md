# @heymp/scratchpad

A super fast way of debugging javascript snippets in a Playwright browser.  If you love [Chrome snippets]([url](https://developer.chrome.com/blog/devtools-tips-26))
but hate that they aren't portable then give Scratchpad a try!

https://github.com/heyMP/scratchpad/assets/3428964/2a58d587-510d-418f-bd8a-99958e1d8277

## Usage

```bash
npx @heymp/scratchpad@next run ./my-test-file.js
```

## Commands

```bash
Usage: @heymp/scratchpad@next run <file> [options]

Run TS/JS snippets in a locally

Options:
  -V, --version         output the version number
  -h, --help            display help for command

Commands:
  run [options] <file>  Execute a file in a browser.
  generate              Generate files from templates.
  help [command]        display help for command
```

## Config

An alternative to using the CLI flags, you can create `scratchpad.config.js`.

```js
export default /** @type {import('@heymp/scratchpad/src/config').Config} */ ({
  devtools: true,
  url: 'https://google.com',
  headless: true,
});
```

### Playwright runtime

The `scratchpad.config.js` exposes a method for altering the playwright runtime.
This allows you to interact with the Playwright API to perform actions like blocking
network requests or navigating to different urls.

```js
export default /** @type {import('@heymp/scratchpad/src/config').Config} */ ({
  devtools: true,
  playwright: async (args) => {
    const { context, page } = args;
    // block esmodule shims
    await context.route(/es-module-shims\.js/, async route => {
      await route.abort();
    });
    await page.goto('https://ux.redhat.com');
  }
});
```

## Logging

To send log information from the Chromium browser to node.js we expose the following functions.

| Method | Description                                | Example   |
|--------|--------------------------------------------|-----------|
| log    | Log data to the stdnout of our terminal and to the Chromium Console it's running. Supports logging advanced types like Arrays, Generators, Iteratiors, Maps, Sets, and Functions. | `log(new Map([[1,2]])` |
| clear  | Clear the previous console output results. | `clear()` |
| writeFile  | Write data to a local file. | `writeFile('./log.txt', data)` |
| appendFile  | Append data to a local file. | `appendFile('./log.txt', data)` |


Example

```js
clear();
function* generator(limit) {
  for (let i = 0; i < limit; i++) {
    yield i;
  }
}

const set = new Set([1,2]);
const map = new Map([[1,2]]);

const gen = generator(10);
log([1,3]);
log(gen);
log(gen.next());
log([...gen]);
log(set);
log(map);
log(set.values());
log([...set.values()]);
log([...set.entries()]);
log(new Promise(res => res()));
log(function hello() { return 'world' });
log(undefined);
```

## Custom exposed functions

You can provide your own custom exposed functions using the `scratchpad.config.js` file.

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

## Typescript

Scratchpad also has out of the box support for Typescript. Any file that ends with `.ts` will
be first transpiled by `esbuild` command. While you can execute typescript files using the
`npx @heymp/scratchpad` command, it is reccommended to install the package locally so you can
import the library typings.

Example:

```bash
npm install @heymp/scratchpad
```

Recommended `tsconfig.json` settings. NOTE: your local `tsconfig.json` file is only used to
for your local Typescript LSP. The `tsc` commnand built in to the Scratchpad ignores
your local `tsconfig.json` file. If you need to add custom rules to the compiled output
that is executed in the chromium browser then you will need hand the ts -> js compile step
yourself.

```json
{
  "target": "esnext",
  "compilerOptions": {
    "types": ["./node_modules/@heymp/scratchpad/types.d.ts"]
  }
}
```

An alternatice to the `tsconfig.json` file is to use the following triple-slash comment
in your `.ts` files:

```ts
/// <reference path="./node_modules/@heymp/scratchpad/types.d.ts" />
```


## Development

```bash
npm install
```

```bash
./bin/cli.js -h
```
