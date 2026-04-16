---
applyTo: "ui/**"
description: Enforce consistent visual design quality — proper depth/layering, animations, modals, tooltips, and design-token usage. No flat, sparse, or mismatched UI.
---

# UI Design Standards

Every UI surface must use the full design language of this project: glass-morphism tokens, animation primitives, modal overlays, proper z-index layering, and accessible tooltips. Flat, bare, or hacked-together UI is a defect.

## Design tokens and theming

- The single source of truth for all visual values is `ui/app/styles/_variables.scss`. Dark-mode tokens are layered via `[data-theme="dark"]` attribute selectors, light-mode via `:root`.
- **Never mix** Tailwind utility colors (`bg-gray-900`, `text-white`) with CSS-var tokens on the same element. Pick one system. Where the design system has a token, use it.
- Glass surface hierarchy:
  - Lowest: `var(--surface)` — flat page background
  - Mid: `var(--surface-glass)` + `backdrop-filter: blur(var(--glass-blur-md))` — cards, panels
  - Elevated: `var(--surface-glass-elevated)` + `blur(var(--glass-blur-lg))` — floating menus, popovers
  - Modal: `var(--bg)` base + `shadow-2xl` — full dialog overlays

## Depth and z-index layering

Use a strict z-index stack. Do not pick ad-hoc numbers.

| Layer | z-index | Usage |
|---|---|---|
| Page content | 0 | Normal layout flow |
| Sticky headers / sidebars | 10 | `AppShell`, `Header`, `Sidebar` |
| Dropdowns / popovers | 20 | Context menus, select dropdowns |
| Tooltips | 30 | Help text, overflow labels |
| Notification toasts | 40 | `ToastContainer` |
| Modals / dialogs | 50 | `Modal.tsx` — always `z-50` |
| Critical overlays | 60 | Full-screen loaders, auth gate |

Never assign `z-index: 9999` or other magic numbers. If `z-50` (Tailwind) is not sufficient, escalate to the next defined layer and document why.

## Animations

All state transitions must be animated. Instant appearing/disappearing elements are not acceptable.

- Use the keyframes in `ui/app/styles/_animations.scss`: `fadeIn`, `scaleIn`, `slideInUp`, `slideInDown`.
- Standard enter animation for modals and cards: `scaleIn 160ms cubic-bezier(0.16, 1, 0.3, 1)`.
- Standard enter animation for toasts and slide-in panels: `slideInUp 200ms ease-out`.
- Standard enter for dropdowns/popovers: `slideInDown 140ms ease-out` + `fadeIn 140ms ease-out`.
- Exit animations: use CSS `opacity` + `transform` transitions, or apply classes via React state before unmounting.
- Lists of items entering the DOM: stagger `animation-delay` by `40ms` per item (max 5 items, then no further delay).

## Modals, dialogs, and sheets

- All confirmation dialogs, detail views, creation forms, and destructive actions must use `Modal.tsx`.
- Modal must: trap focus, close on `Escape`, close on backdrop click, scroll internally when content overflows (`overflow-y-auto` on the inner panel), and animate in with `scaleIn`.
- Destructive confirmations require an explicit warning heading in `var(--status-error)` color plus a `danger` variant `Button`.
- Never implement a "fake modal" with `position: absolute` or conditional rendering of a sibling div outside the portal.

## Tooltips

- Every interactive element that is icon-only (no visible label) **must** have a tooltip. No exceptions.
- Tooltip trigger: use a `title` attribute as baseline, plus a custom CSS tooltip via `data-tooltip` + `::after` pseudo-element from `_components.scss` (or a shared `Tooltip` wrapper if one exists).
- Tooltip z-index: `z-30` (see table above).
- Tooltip content: concise action description, not a label repeat (e.g., `"Export as JSON"` not `"Export"`).

## Component visual completeness checklist

Before marking any UI task done, verify:

- [ ] All interactive states are styled: `:hover`, `:focus-visible`, `:active`, `:disabled`
- [ ] Loading states use `Spinner` from `ui/components/ui/Spinner.tsx`, not raw CSS spinners or `...` text
- [ ] Empty states have an icon + headline + optional CTA — never a blank `<div>`
- [ ] Error states surface a human-readable message + retry affordance, not just `"Error"` or console output
- [ ] Destructive actions are gated behind a `Modal` confirmation
- [ ] Every icon-only button has a tooltip

## Scope

Applies to all files under `ui/`. When reviewing or generating UI code, flag any surface that violates these standards as a blocking issue, not a suggestion.
