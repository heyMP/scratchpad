---
"@heymp/scratchpad": patch
---

Improve interactive session selection with an arrow-key picker.

When picking a session (`run --session`, `session delete`, or `session rename` without a name), scratchpad now shows a radio-style list you can navigate with arrow keys and confirm with Enter. Press Escape to cancel interactive delete, rename, or login prompts. Non-interactive environments fall back to the numbered readline picker.
