# @heymp/scratchpad

A super fast way of debugging javascript snippets in a Playwright browser.  If you love [Chrome snippets]([url](https://developer.chrome.com/blog/devtools-tips-26))
but hate that they aren't portable then give Scratchpad a try!

https://github.com/heyMP/scratchpad/assets/3428964/2a58d587-510d-418f-bd8a-99958e1d8277

## Usage

```bash
npx @heymp/scratchpad@next run ./my-test-file.js
```

Note: This is still in development. Use the `next` tag until 1.0 release is ready.

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
export default ({
  devtools: true,
  url: 'https://google.com',
  headless: true,
});
```

#### Define Config

While you can create a `scratchpad.config.js` file above without installing this package,
it's recommended to install `@heymp/scratchpad` and use the `defineConfig` helper to access
the correct types.

**Usage:**

`scratchpad.config.js`
```ts
import { defineConfig } from '@heymp/scratchpad';

export default defineConfig({
  devtools: true,
  url: 'https://google.com',
  headless: true,
});
```

#### Reroute Documents

The `rerouteDocument` function allows you to replace the HTML content of any webpage with a local HTML file from your system. This is incredibly useful for testing changes or developing components in the context of a live site without deploying your code.

When used, `rerouteDocument` also watches your local HTML file for changes. If you save an update to the file, the Playwright page will automatically reload to reflect your latest edits, providing a fast feedback loop.

**How it works:**

* It intercepts requests made by the Playwright `page` that are for HTML documents.
* It maps the URL's path to a local file structure. For instance, if you are on `http://example.com/user/profile` and you've set your local directory to `'./my-pages'`, the function will look for `'./my-pages/user/profile/index.html'`.

**Usage:**

You would typically use this function within the `playwright` async method in your `scratchpad.config.js`:

`scratchpad.config.js`
```javascript
import { defineConfig, rerouteDocument } from '@heymp/scratchpad';

export default defineConfig({
  url: 'https://example.com', // The initial URL you are working with
  playwright: async (args) => {
    const { page } = args;

    // Tell Scratchpad to serve local HTML files from the './pages' directory
    // whenever a document is requested.
    await rerouteDocument(page, './pages');

    // Now, if you navigate to https://example.com/some/path,
    // Scratchpad will try to serve './pages/some/path/index.html'.
    // If that file doesn't exist, it will load the original page from the web.
  }
});
```

#### Reroute URLs

The `rerouteUrl` function gives you the power to intercept network requests for specific assets (like JavaScript files, CSS, images, or API calls) and redirect them. You can reroute a `target` URL to either another live `source` URL or to a `source` local file from your system. This is incredibly useful for testing local versions of assets against a live site, mocking API responses, or redirecting to different service endpoints without deploying code.

If you save an update to this file, the Playwright page will automatically reload to show your latest edits, creating a very fast development feedback loop.

**How it works:**

* It uses Playwright's `page.route()` to intercept network requests that match the `target` URL or pattern you specify.
* If you set `type: 'url'`, it fetches the content from your specified `source` URL instead of the original `target`.
* If you set `type: 'path'`, it serves the content from your local `source` file. It also starts watching this file, and if any changes are detected, it reloads the page.

**Usage:**

You typically use `rerouteUrl` within the `playwright` async method in your configuration file (e.g., `scratchpad.config.js`):

`scratchpad.config.js`
```javascript
import * as Scratchpad from '@heymp/scratchpad';

export default Scratchpad.defineConfig({
  url: 'https://www.your-website.com',
  playwright: async (args) => {
    const { page } = args;

    // Example 1: Reroute a specific JavaScript file to a local version
    await Scratchpad.rerouteUrl(page, {
      type: 'path',
      target: '**/scripts/main-app.js', // Intercept requests for this JS file
      source: './local-dev/main-app.js'  // Serve your local version instead
    });

    // Example 2: Reroute an API call to a different endpoint
    await Scratchpad.rerouteUrl(page, {
      type: 'url',
      target: 'https://api.production.com/data', // Original API endpoint
      source: 'https://api.staging.com/data'     // Reroute to staging API
    });

    // Example 3: Reroute an API call to a local mock JSON file
    await Scratchpad.rerouteUrl(page, {
      type: 'path',
      target: 'https://api.production.com/user/settings',
      source: './mocks/user-settings.json' // Serve local mock data
    });

    // Now, when the page requests '**/scripts/main-app.js',
    // your local './local-dev/main-app.js' will be served and auto-reloaded on change.
    // Requests to 'https://api.production.com/data' will go to the staging API.
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
| readFile  | read data from a local file. | `readFile('./log.txt', 'utf8')` |


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
import * as Scratchpad from '@heymp/scratchpad';
import { join } from 'node:path'
import fs from 'node:fs/promises';

function loadFile(path) {
  return fs.readFile(join(process.cwd(), path), 'utf8');
}

export default defineConfig({
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

An alternative to the `tsconfig.json` file is to use the following triple-slash comment
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
