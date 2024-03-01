# @heymp/scratchpad

A super fast way of debugging javascript snippets in a Puppeteer browser.  If you love [Chrome snippets]([url](https://developer.chrome.com/blog/devtools-tips-26))
but hate that they aren't portable then give Scratchpad a try!

https://github.com/heyMP/scratchpad/assets/3428964/2a58d587-510d-418f-bd8a-99958e1d8277

## Usage

```bash
npx @heymp/scratchpad@latest ./my-test-file.js
```

## Options

```bash
Usage: @heymp/scratchpad@latest <file> [options] 

Arguments:
  file                  file to execute in the browser.

Options:
  --headless [boolean]  specify running the browser in headless mode.
  --url [string]        specify a specific url to execute the code in.
  -V, --version         output the version number
  -h, --help            display help for command
```


## Logging

To send log information from the Chromium browser to node.js we expose two logging helpers, `log()` & `clear()`.

| Method | Description                                | Example   |
|--------|--------------------------------------------|-----------|
| log    | Log data to the stdnout of our terminal and to the Chromium Console it's running. Supports logging advanced types like Arrays, Generators, Iteratiors, Maps, Sets, and Functions. | `log(new Map([[1,2]])` |
| clear  | Clear the previous console output results. | `clear()` |


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
```

## Typescript

Scratchpad also has out of the box support for Typescript. Any file that ends with `.ts` will
be first transpiled by the `tsc -w` command. While you can execute typescript files using the
`npx @heymp/scratchpad` command, it is reccommended to install the package locally so you can
import the library typings.

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

## Development

```bash
npm install
```

```bash
./bin/cli.js -h
```
