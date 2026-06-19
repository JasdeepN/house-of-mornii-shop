---
name: ui-audit
description: Audit UI consistency across the application — detect duplicated CSS, flag color contrast issues, verify font/animation consistency, and identify shared elements that should be centralized. Use when reviewing visual consistency, refactoring styling, or ensuring design system compliance.
---

# UI Audit

Audit visual consistency across all pages and components. Ensure no CSS duplication, cohesive colors, consistent typography/animations, and centralized shared elements.

## When to use

- Before a release or major refactor
- After adding new components/pages that may introduce inconsistencies
- When the user asks to "audit UI", "check styling consistency", "find duplicated CSS"
- When reviewing PRs that touch multiple components or pages

## When NOT to use

- Only one file changed and no cross-component impact
- The user explicitly wants to skip visual consistency checks

## Inputs required

- None — the skill scans the entire `src/` directory

## Workflow

### 1. Scan for CSS/style duplication

Read [`references/css-duplication-checklist.md`](references/css-duplication-checklist.md) for the full checklist. Then:

1. Search all `.tsx`, `.ts`, `.scss`, `.css` files in `src/` for inline styles, hardcoded colors, and repeated class patterns
2. Compare against the design system tokens in [`src/tailwind.css`](src/tailwind.css) and [`src/index.scss`](src/index.scss)
3. Flag any hardcoded OKLCH/RGB values that should use CSS variables
4. Identify duplicate utility class combinations across components

### 2. Color contrast and cohesion audit

Read [`references/color-contrast-guidelines.md`](references/color-contrast-guidelines.md) for WCAG requirements and project-specific thresholds. Then:

1. Extract all foreground/background color pairs from JSX/TSX files
2. Check each pair against WCAG AA (4.5:1 for normal text, 3:1 for large text)
3. Flag colors that are too similar to cause accessibility issues
4. Verify all colors use the established token system (`--gold`, `--teal-deep`, etc.)

### 3. Typography consistency check

Read [`references/typography-guidelines.md`](references/typography-guidelines.md) for the project's font hierarchy. Then:

1. Search all components for font-family declarations
2. Verify H1-H6 use correct fonts (Cinzel, Playfair Display, Bodoni Moda)
3. Check body text uses Cormorant at 18px
4. Flag any hardcoded font sizes that deviate from the scale

### 4. Animation and transition audit

Read [`references/animation-guidelines.md`](references/animation-guidelines.md) for duration/easing standards. Then:

1. Search for all `transition-` classes and `framer-motion` animations
2. Verify durations are under 400ms (except page transitions)
3. Check easing functions match `luxuryEase` cubic-bezier [0.16, 1, 0.3, 1]
4. Flag inconsistent animation patterns

### 5. Shared element centralization

Read [`references/shared-element-checklist.md`](references/shared-element-checklist.md) for the list of elements that must be centralized. Then:

1. Identify duplicate component implementations (e.g., multiple button variants that should use `ui/button`)
2. Check for repeated layout patterns that should use shared wrappers
3. Verify all components use `cn()` from `@/lib/utils.ts` for conditional classes
4. Flag any custom CSS that duplicates Tailwind utilities

### 6. Generate audit report

Write findings to a structured report:

```markdown
# UI Audit Report — <date>

## Summary
- Total files scanned: <N>
- Duplicated CSS blocks found: <N>
- Color contrast issues: <N>
- Typography deviations: <N>
- Animation inconsistencies: <N>
- Shared element violations: <N>

## Critical Issues (must fix)
| File | Issue | Severity | Recommendation |
|------|-------|----------|----------------|

## Warnings (should fix)
...

## Notes (informational)
...
```

### 7. Fix recommendations

For each critical issue, propose a concrete fix:
- Move duplicated CSS to SCSS mixins or Tailwind utilities
- Replace hardcoded colors with CSS variables
- Centralize shared components into `src/components/ui/`
- Update animations to match project standards

## Files

| File | Purpose |
|------|---------|
| [`references/css-duplication-checklist.md`](references/css-duplication-checklist.md) | Full CSS duplication detection checklist |
| [`references/color-contrast-guidelines.md`](references/color-contrast-guidelines.md) | WCAG thresholds and project color tokens |
| [`references/typography-guidelines.md`](references/typography-guidelines.md) | Font hierarchy and size scale |
| [`references/animation-guidelines.md`](references/animation-guidelines.md) | Duration/easing standards |
| [`references/shared-element-checklist.md`](references/shared-element-checklist.md) | Elements that must be centralized |
| [`scripts/scan-css-duplication.sh`](scripts/scan-css-duplication.sh) | Execute to find hardcoded colors and duplicate patterns |

## Examples

### Audit after adding a new component

```
User: "I just added ProductGallery, audit the whole app for consistency"

Agent runs:
1. Executes scripts/scan-css-duplication.sh to find hardcoded values
2. Reads references/css-duplication-checklist.md and checks all components
3. Checks color contrast in ProductGallery and related components
4. Verifies typography matches H3=28px Cinzel for product titles
5. Checks framer-motion animations use luxuryEase
6. Generates audit report with findings
```

### Audit before release

```
User: "Pre-release UI audit"

Agent runs:
1. Full scan of all 30+ components and 10+ pages
2. Reports all critical issues first, then warnings
3. Suggests centralized fixes for duplicated patterns
4. Writes findings to docs/ui-audit/YYYY-MM-DD.md
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `scripts/scan-css-duplication.sh` fails | Ensure grep and awk are available; fall back to manual search |
| False positives on Tailwind utilities | Cross-reference with src/tailwind.css tokens before flagging |
| Color contrast tool not available | Use manual OKLCH lightness difference calculation (delta > 0.45 for AA) |
