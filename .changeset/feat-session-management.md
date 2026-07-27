---
"@heymp/scratchpad": minor
---

Add named session management with a new `session` command.

Sessions are stored in `~/.scratchpad/sessions/<name>.json` and can be reused from any project directory.

**Save a session**

```bash
npx @heymp/scratchpad@next session login
npx @heymp/scratchpad@next session login --name work
```

**Use a session**

```bash
npx @heymp/scratchpad@next run --session work ./my-test-file.js
npx @heymp/scratchpad@next run --session ./my-test-file.js
```

**Manage sessions**

```bash
npx @heymp/scratchpad@next session list
npx @heymp/scratchpad@next session rename work personal
npx @heymp/scratchpad@next session delete work
```

**Breaking changes**

- Removed `scratchpad generate login` (use `scratchpad session login` instead)
- Removed `--login` and `--session-path` from `scratchpad run` (use `--session [name]` instead)
- Removed `login` and `sessionPath` config options (use `session` instead)
