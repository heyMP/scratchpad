---
"@heymp/scratchpad": major
---

Typescript Support

Compiles files ending in `.ts` using tsc.

Example:

```bash
npm install @heymp/scratchpad
```

Recommended tsconfig.json settings.

```json
{
  "target": "esnext",
  "compilerOptions": {
    "types": ["./node_modules/@heymp/scratchpad/types.d.ts"]
  }
}
```
