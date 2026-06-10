---
"@heymp/scratchpad": patch
---

Adding Launch options overrides

The `launchOptions` field passes options directly through to Playwright's [`chromium.launch()`](https://playwright.dev/docs/api/class-browsertype#browser-type-launch). This is useful for setting custom browser args, slow motion, or any other Playwright launch option without scratchpad needing to expose each one individually.

```js
export default ({
  url: 'https://example.com',
  launchOptions: {
    args: [
      '--remote-debugging-port=9222',
      '--remote-allow-origins=*',
    ],
  },
});
```

The top-level `headless` and `devtools` fields continue to work as shortcuts. When both a top-level shortcut and `launchOptions` set the same value, the top-level shortcut wins. The `args` array from `launchOptions` is concatenated with any args added by other config fields (e.g. `bypassCSP`), so neither set is lost.

