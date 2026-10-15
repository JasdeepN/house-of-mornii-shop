---
applyTo: "**"
description: Minimum verification before a task is called done.
---

Done means the changed path was exercised and passed.

- Run the narrowest relevant test (`npx vitest run <file>`); for UI changes also run `npm run build`.
- Security fixes add a regression test with a blocked-exploit case and a valid-input case, and run it.
- A failure is fixed, or shown to be unrelated. Unrun checks are reported as blocked, never as passing.
- Final summary states the commands run and whether the result is verified, partial, or blocked.
