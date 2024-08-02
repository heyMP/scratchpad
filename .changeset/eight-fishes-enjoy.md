---
"@heymp/scratchpad": minor
---

Expose Playwright runtime context to scratchpad.config.js [#40](https://github.com/heyMP/scratchpad/issues/40)

`scratchpad.config.js`
```js
export default /** @type {import('@heymp/scratchpad/config').Config} */ ({
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
