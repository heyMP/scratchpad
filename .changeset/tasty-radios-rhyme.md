---
"@heymp/scratchpad": patch
---

Add typings for scratchpad.config.js [#37](https://github.com/heyMP/scratchpad/issues/37)

```js
export default /** @type {import('@heymp/scratchpad/config').Config} */ ({
  devtools: true,
  headless: true,
  url: 'https://google.com',
});
```
