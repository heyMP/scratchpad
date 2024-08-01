---
"@heymp/scratchpad": minor
---

Add `scratchpad.config.js` file as an alternative to specifying scratchpad options
using the CLI flags.

```js
export default ({
  devtools: true,
  headless: false,
  url: 'https://www.google.com'
});
```

NOTE: CLI flags will take precidence over config file options.
