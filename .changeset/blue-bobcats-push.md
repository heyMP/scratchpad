---
"@heymp/scratchpad": minor
---

Add new generate commands

**Generate document**

Fetch HTML source of url and save it to a local file. This is helpful when using the `rerouteDocument` command.

```bash
npx @heymp/scratchpad@next generate document https://www.example.com pages
```

**Generate login**

Launch a new browser that saves your session so it can be reused.

```bash
npx @heymp/scratchpad@next generate login
```

You can then reuse the session by using the `login` option when using the `run` command.

```bash
npx @heymp/scratchpad@next run --login
```
