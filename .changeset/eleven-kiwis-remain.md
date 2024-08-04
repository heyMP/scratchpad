---
"@heymp/scratchpad": minor
---

Add `writeFile`, `appendFile` exposed functions. (#44)[https://github.com/heyMP/scratchpad/issues/44]

```.js
await writeFile('./log.txt', 'hello');
await appendFile('./log.txt', '\n');
await appendFile('./log.txt', 'world');
```

Include custom exposed functions example.

```.js
import { join } from 'node:path'
import fs from 'node:fs/promises';

function loadFile(path) {
  return fs.readFile(join(process.cwd(), path), 'utf8');
}

export default /** @type {import('@heymp/scratchpad/src/config').Config} */ ({
  playwright: async (args) => {
    const { context, page } = args;
    await context.exposeFunction('loadFile', loadFile)
  }
});
```
