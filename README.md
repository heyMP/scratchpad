# @heymp/scratchpad

A super fast way of debugging javascript snippets in a Puppeteer browser!

## Usage

```bash
npx @heymp/scratchpad@latest ./my-test-file.js
```

## Options

```bash
Usage: @heymp/scratchpad@latest [options] <file>

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

## Development

```bash
npm install
```

```bash
./bin/cli.js -h
```
