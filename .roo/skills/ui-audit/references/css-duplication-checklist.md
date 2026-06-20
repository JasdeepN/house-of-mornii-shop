# CSS Duplication Detection Checklist

## Table of Contents
1. [Hardcoded Colors](#hardcoded-colors)
2. [Inline Styles](#inline-styles)
3. [Duplicate Class Patterns](#duplicate-class-patterns)
4. [SCSS Mixin Coverage](#scss-mixin-coverage)
5. [Tailwind Token Usage](#tailwind-token-usage)

## Hardcoded Colors

Search for these patterns in `.tsx`/`.ts` files:

```bash
grep -rn 'oklch(' src/components/ --include='*.tsx' | grep -v 'className'
grep -rn '#[0-9a-fA-F]\{3,6\}' src/components/ --include='*.tsx'
grep -rn 'rgb(' src/components/ --include='*.tsx'
```

**Rule:** All colors must use CSS variables from `src/tailwind.css`:
- `--background`, `--foreground`
- `--card`, `--card-foreground`
- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--destructive`, `--destructive-foreground`
- `--gold`, `--gold-bright`, `--teal-deep`, `--slate-dark`
- `--ring`, `--border`, `--input`

## Inline Styles

Search for inline style objects:

```bash
grep -rn 'style={' src/components/ --include='*.tsx'
```

**Rule:** Inline styles are only allowed for dynamic values (e.g., width based on cart progress). Static styling must use Tailwind classes or CSS variables.

## Duplicate Class Patterns

Search for repeated class strings across components:

```bash
grep -rn 'glass-panel' src/components/ --include='*.tsx' | wc -l
grep -rn 'golden-glow' src/components/ --include='*.tsx' | wc -l
grep -rn 'font-cinzel' src/components/ --include='*.tsx' | wc -l
```

**Rule:** If a class pattern appears in 3+ components, verify it's using the shared component wrapper (e.g., `BaroqueCard`, `OrnamentalBorder`) rather than manual class assembly.

## SCSS Mixin Coverage

Verify these mixins are used consistently:

| Mixin | Purpose | Expected Usage |
|-------|---------|----------------|
| `ornamental-surface` | Background patterns | Pages, not individual components |
| `glass-panel` utilities | Glass morphism | Shared via `GlassPanel` component |

**Rule:** Components should NOT redefine SCSS mixins — they should use the shared ones from `src/index.scss`.

## Tailwind Token Usage

Verify these utility classes are used correctly:

| Class Pattern | Should Use |
|---------------|------------|
| `bg-[oklch(...)]` | `bg-card`, `bg-primary`, etc. |
| `text-[oklch(...)]` | `text-foreground`, `text-muted-foreground`, etc. |
| `border-[oklch(...)]` | `border-border` |
| Custom padding/margin | Tailwind spacing scale (4, 8, 12, 16, 24) |
