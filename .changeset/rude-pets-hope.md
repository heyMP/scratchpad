---
"@heymp/scratchpad": minor
---

Support ts config files

`scratchpad.config.ts`
```ts
import { Config } from '@heymp/scratchpad/src/config.js';

export function hi(name: string) {
  console.log(`Hi there ${name}`);
}

declare global {
  interface Window {
    hi: typeof hi;
  }
}

export default ({
  playwright: async (args) => {
    const { context } = args;
    await context.exposeFunction('hi', hi);
  }
}) satisfies Config;
```

`test.ts`
```.ts
/// <reference path="./scratchpad.config.ts" />

window.hi('Bob');
```
