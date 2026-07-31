---
"@heymp/scratchpad": patch
---

Delete multiple saved browser sessions at once.

Omitting session names on `session delete` now shows a checkbox picker so you can select several sessions before confirming. You can also pass multiple names on the command line:

```bash
npx @heymp/scratchpad@next session delete
npx @heymp/scratchpad@next session delete work personal
```
