# Color Contrast Guidelines

## WCAG AA Requirements

| Text Size | Minimum Contrast Ratio |
|-----------|----------------------|
| Normal text (< 18px) | 4.5:1 |
| Large text (>= 18px or >= 14px bold) | 3:1 |
| UI components / non-text | 3:1 |

## Project Color Tokens (Dark Mode)

From [`src/tailwind.css`](../../../src/tailwind.css):

```css
--background: oklch(0.15 0.02 210);       /* Darkest slate */
--foreground: oklch(0.95 0.05 85);         /* Near-white */
--card: oklch(0.22 0.03 210);              /* Card background */
--card-foreground: oklch(0.92 0.02 85);    /* Card text */
--primary: oklch(0.45 0.08 210);           /* Teal accent */
--secondary: oklch(0.30 0.03 210);         /* Darker teal */
--muted: oklch(0.25 0.02 210);             /* Muted bg */
--muted-foreground: oklch(0.65 0.03 210);  /* Muted text */
--accent: oklch(0.60 0.11 78);             /* Gold accent */
--destructive: oklch(0.55 0.20 25);        /* Red */
```

## Project Color Tokens (Light Mode)

```css
--background: oklch(0.96 0.005 85);        /* Near-white */
--foreground: oklch(0.15 0.02 78);         /* Dark text */
--card: oklch(0.97 0.005 85);              /* Card bg */
--accent: oklch(0.60 0.11 78);             /* Gold accent */
```

## Cohesion vs Distinction Rules

### Text on Background Pairs (Critical)

| Pair | Lightness Delta | Min Ratio | Status |
|------|-----------------|-----------|--------|
| `--foreground` on `--background` | 0.80 | 4.5:1 | PASS |
| `--card-foreground` on `--card` | 0.70 | 4.5:1 | PASS |
| `--muted-foreground` on `--muted` | 0.40 | 4.5:1 | WARN — borderline |
| `--accent-foreground` on `--accent` | 0.52 | 4.5:1 | PASS |

### Similar Color Warnings

Flag any two colors used in the same visual context if their lightness delta is < 0.15 — they will appear visually indistinguishable at small sizes.

## Audit Steps

1. Extract all foreground/background pairs from JSX
2. Calculate lightness difference (L value in OKLCH)
3. If delta < 0.45 for normal text → flag as critical
4. If delta < 0.30 → flag as must-fix
5. Verify no hardcoded colors bypass the token system
