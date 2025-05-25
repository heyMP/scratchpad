---
"@heymp/scratchpad": minor
---

Add clone command to copy remote files locally

```bash
npx @heymp/scratchpad@next clone https://www.example.com/scripts.js
```

Added new generic helper to reroute both document and asset file types.

scratchpad.config.ts
```ts
export default Scratchpad.defineConfig({
  playwright: async (args) => {
    const { page } = args;
    Scratchpad.rerouteLocal(page, 'pages');
  }
});
```
