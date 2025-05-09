---
"@heymp/scratchpad": minor
---

Add config and playwright rerouting helpers

Export `defineConfig`, `rerouteUrl`, `rerouteDocument`.

Example:

```ts
import * as Scratchpad from '@heymp/scratchpad';

export default Scratchpad.defineConfig({
  devtools: true,
  url: 'https://www.redhat.com/en',
  playwright: async (args) => {
    const { page } = args;
    await Scratchpad.rerouteDocument(page, './pages');
    await Scratchpad.rerouteUrl(page, {
      type: 'path',
      target: '**/rh-cta/rh-cta.js',
      source: './rh-cta.js'
    })
  }
});
```
