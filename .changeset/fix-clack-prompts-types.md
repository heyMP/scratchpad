---
"@heymp/scratchpad": patch
---

Fix TypeScript errors caused by @clack/prompts 1.8.0 returning `T | symbol` from prompt functions. Added explicit return type annotations and type casts after `isCancel` guards in utils.ts and login.ts.
