---
"@heymp/scratchpad": minor
---

Add a `debug` config option and `--debug` CLI flag for remote debugging.

When enabled, scratchpad auto-picks an available port starting from 9222 (or uses a port you specify) and prints the CDP endpoint on launch. This replaces manually setting `--remote-debugging-port` and `--remote-allow-origins=*` in `launchOptions.args`.

```js
export default {
  url: 'https://example.com',
  debug: true,
};
```

```bash
npx @heymp/scratchpad@next run --debug ./my-test-file.js
npx @heymp/scratchpad@next run --debug 9333 ./my-test-file.js
```
