---
applyTo: "**"
description: Always check for and reuse existing code, components, utilities, and patterns before writing new ones. Rewriting working code is a defect, not an improvement.
---

# Reuse Before Rewrite

Before adding any new code, search for an existing implementation. This applies to UI components, backend utilities, hooks, helpers, constants, and style tokens alike.

## Required behavior

- **Audit before authoring.** Before creating a new component, hook, utility, or helper, search `ui/components/`, `ui/lib/`, `src/utils/`, and `src/tools/` for an existing implementation. Only create a new abstraction when nothing suitable exists.
- **Extend, don't fork.** Prefer adding props, variants, or optional behavior to an existing component over creating a parallel copy. Duplicate components with slightly different styling are the primary source of theme drift.
- **Use the established component library.** The `ui/components/ui/` directory contains the canonical primitives: `Button`, `Badge`, `Spinner`, `Icon`, `TabBar`, `SectionNav`. Use these directly. Do not inline their logic with one-off `<button>` or `<div>` elements.
- **Use `Modal.tsx` for all dialogs.** Do not implement ad-hoc overlay divs, `position: fixed` panels, or custom sheet components. `Modal.tsx` is the single source of truth for dialogs, confirmations, and detail sheets.
- **Consume design tokens, never hardcode values.** Colors, spacing, shadows, blur, border-radii, and z-index layers are defined in `ui/app/styles/_variables.scss`. Reference CSS custom properties (`var(--brand-accent)`, `var(--surface-glass)`, etc.). Never write literal hex values, `rgba(...)`, or `px` shadows inline in component code unless you are inside `_variables.scss` itself.
- **Reuse animation keyframes.** Named keyframes (`fadeIn`, `scaleIn`, `slideInUp`, `slideInDown`, `navGlowTrail`) exist in `ui/app/styles/_animations.scss`. Apply them via CSS class or `animation` style bindings. Do not re-declare the same keyframe in a component file.
- **Reuse API client functions.** Backend calls go through the functions in `ui/lib/`. Do not write raw `fetch(...)` calls inside components. If no helper exists for an endpoint, add one to the appropriate `lib/` file and call it everywhere.

## Anti-patterns to reject

- Creating a second `<Modal>`-like component (e.g., `Drawer.tsx`, `Popup.tsx`, `Dialog.tsx`) without first checking whether `Modal.tsx` can cover the use case with a new prop.
- Adding raw Tailwind classes that duplicate SCSS variable behavior (e.g., `bg-white/10` when `var(--surface-glass)` already expresses the same intent).
- Copying a component into a feature folder and then tweaking it slightly — always trace it back to the shared library.
- Importing a color constant as a string literal in a `.tsx` file instead of referencing the CSS variable.

## Scope

This rule applies to all changes in `ui/` and `src/`. When writing code review comments or fixing code, flag rewrite violations alongside functional bugs.
