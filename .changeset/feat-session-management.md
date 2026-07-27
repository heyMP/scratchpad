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

Interactive session selection uses an arrow-key picker (with a numbered readline fallback in non-interactive environments). Press `s` during `run` to save the current browser session mid-flight.

**Breaking changes**

- Removed `scratchpad generate login` (use `scratchpad session login` instead)
- Removed `--login` and `--session-path` from `scratchpad run` (use `--session [name]` instead)
- Removed `login` and `sessionPath` config options (use `session` instead)

**Migration**

If you previously used `generate login`, move your session file to the new location:

```bash
mkdir -p ~/.scratchpad/sessions
cp .scratchpad/login.json ~/.scratchpad/sessions/default.json
```
