---
applyTo: "src/**"
description: Reuse existing components, hooks, helpers, tokens, and API functions before writing new ones.
---

Search before authoring; extend before forking.

- Components: reuse `src/components/ui/` primitives (`button`, `dialog`, `sheet`, `drawer`, ...). Add props or variants to existing components instead of copying them.
- Colors: OKLCH only, via theme variables and Tailwind tokens (`bg-accent`); no hex or rgb.
- Shopify: go through `@/lib/shopify` (barrel) and its hooks; no raw `fetch` in components.
- Class merging: `cn()` from `@/lib/utils`.
- Flag duplication in review alongside functional bugs.
