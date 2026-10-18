# Styling System

## Overview

The styling system combines Tailwind CSS 4 (without PostCSS), SCSS for complex mixins, and CSS custom properties for theming. The design language is a champagne and teal palette in the OKLCH color space, light only (v1.0 has no dark mode), with a teal header and footer and layout C Product cards. The palette is defined once in [`src/tailwind.css`](src/tailwind.css).

```mermaid
graph TB
    subgraph SCSS["SCSS Layer (src/index.scss)"]
        Mixins[ornamental-surface mixin]
        Bars[.bar-teal header and footer]
        ThemeVars[Theme CSS variables]
    end

    subgraph Tailwind["Tailwind CSS 4"]
        Utilities[Tailwind utility classes]
        Plugins[@tailwindcss/vite + container-queries]
        ThemeJSON[theme.json token merging]
    end

    subgraph Components["Component Classes"]
        Glass[glass-panel variants]
        GoldenGlow[.golden-glow]
        Ornamental[OrnamentalBorder styles]
    end

    SCSS --> Components
    Tailwind --> Components
```

## Tailwind CSS 4 Setup

### Configuration

Tailwind CSS 4 uses the Vite plugin (no PostCSS config needed):

```typescript
// vite.config.ts
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

```bash
# tailwind.config.js
import fs from "fs";

// Reads theme.json at build time to merge custom design tokens
let theme = {};
if (fs.existsSync('./theme.json')) {
  theme = JSON.parse(fs.readFileSync('./theme.json', 'utf-8'));
}
```

### Plugins

| Plugin | Purpose |
|--------|---------|
| `@tailwindcss/vite` | Tailwind CSS 4 Vite integration |
| `@tailwindcss/container-queries` | Container query utilities |

### theme.json Integration

> **Note:** The live color tokens come from [`src/tailwind.css`](src/tailwind.css). The color values in `theme.json` below predate the champagne and teal theme.

The [`theme.json`](theme.json) file provides custom design tokens that are merged with Tailwind's default theme at build time:

```json
{
  "colors": {
    "primary": { "value": "oklch(0.60 0.11 78)", "description": "Gold accent" },
    "background": { "value": "oklch(0.16 0.03 210)", "description": "Dark charcoal" },
    "card": { "value": "oklch(0.18 0.03 210)", "description": "Card background" },
    "text": { "value": "oklch(0.95 0.01 210)", "description": "Light text" },
    "accent": { "value": "oklch(0.60 0.11 78)", "description": "Accent hover" }
  },
  "typography": { /* font sizes, weights, line heights */ },
  "spacing": { /* spacing scale */ },
  "borderRadius": { /* border radius scale */ }
}
```

## OKLCH Color System

All colors use the OKLCH color space. The theme is light only: `useTheme` always returns light. Tokens are CSS variables in `:root` of [`src/tailwind.css`](src/tailwind.css), exposed to Tailwind through `@theme` (`bg-background`, `text-muted-foreground`, `bg-primary`, `text-gold-on-teal`).

### Palette

| Token | Value | Usage |
|-------|-------|-------|
| `background` | `oklch(0.924 0.027 78.2)` | Page (champagne) |
| `foreground` | `oklch(0.335 0.045 193.0)` | Text (ink) |
| `card` | `oklch(0.941 0.020 74.7)` | Cards, popovers |
| `muted` | `oklch(0.894 0.032 78.1)` | Quiet surfaces |
| `muted-foreground` | `oklch(0.440 0.020 145.3)` | Secondary text (darkened in #52 to pass AA on every surface) |
| `border` | `oklch(0.846 0.027 80.2)` | Rules and borders |
| `primary` / `accent` | `oklch(0.336 0.054 200.5)` | Teal #063F42: buttons, links, bars |
| `primary-hover` | `oklch(0.409 0.061 199.7)` | Button hover |
| `gold` | `oklch(0.649 0.077 83.8)` | Decoration only, never text |
| `gold-on-teal` | `oklch(0.800 0.100 76)` | Accents on teal |

### Accessibility Ratios

| Pair | Ratio | WCAG |
|------|-------|------|
| Ink on page | 9.4:1 | AAA |
| Muted text on page | 6.14:1 | AA |
| Muted text on card | 6.46:1 | AA |
| Muted text on panel | 5.59:1 | AA |
| Champagne on teal | 9.8:1 | AAA |
| Gold on teal (`gold-on-teal`) | 6.2:1 | AA |
| Gold on page | 2.6:1 | Fails: decoration only, never text |

## CSS Custom Properties

### Glass Panel Variables

Defined in [`src/tailwind.css`](src/tailwind.css). Panels are a near-transparent page color with a rule border and no highlight:

```css
--glass-blur-md: 16px;
--glass-panel-bg: color-mix(in oklch, var(--background) 92%, transparent);
--glass-panel-border: var(--border);
--glass-shadow: 0 1px 0 var(--border);
```

### Golden Glow Variables

The glow is off in the champagne theme (`--golden-glow-intensity: 0` and `--golden-glow-hover-intensity: 0` in [`src/index.scss`](src/index.scss)); `--golden-glow-color` is `var(--gold)`.

### Ornamental Frame Padding

Responsive padding via `clamp()` for ornamental border components:

```css
--ornamental-frame-pad-top: clamp(2.75rem, 5vw, 5rem);
--ornamental-frame-pad-right: clamp(2.5rem, 4.5vw, 4.5rem);
--ornamental-frame-pad-bottom: clamp(4.5rem, 8vw, 7rem);
--ornamental-frame-pad-left: clamp(2.5rem, 4.5vw, 4.5rem);
```

## Glass Panel System

### Base Classes

| Class | Purpose |
|-------|---------|
| `glass-panel` | Semi-transparent panel with backdrop blur |
| `glass-panel--flat` | Flat variant without depth (used in Header) |

### Implementation

The `.glass-panel` class applies:
- Semi-transparent background using CSS custom property
- `backdrop-filter: blur(var(--glass-blur-md)) saturate(var(--glass-saturate)) contrast(var(--glass-contrast))`
- Subtle border from `--glass-panel-border`
- Shadow from `--glass-shadow`

**Usage:**
```tsx
<header className="glass-panel glass-panel--flat border-b border-border/40">
  {/* Fixed header with flat glass */}
</header>

<div className="glass-panel">
  {/* Card with depth and blur */}
</div>
```

## Teal Header and Footer

The `.bar-teal` class (with `.glass-panel`) in [`src/index.scss`](src/index.scss) styles the header and footer:

- Background: teal `oklch(0.336 0.054 200.5)` at 94% with `backdrop-filter: blur(10px) saturate(120%)`
- Text: champagne `oklch(0.941 0.020 74.7)`; muted text `oklch(0.924 0.027 85.7)`
- Accents: `gold-on-teal` `oklch(0.800 0.100 76)`
- Square corners, no shadow
- Inside the bar the tokens (`--foreground`, `--accent`, `--border`, `--ring` and their `--color-*` twins) are remapped to the bar colors, so components render correctly on teal. `.on-page` restores the page values for a surface inside a bar.

## Product Card (layout C)

[`ProductCard`](src/components/ProductCard.tsx): a `bg-card` panel with a rounded corner, soft teal shadow, and a 3px lift on hover or focus. It shows the whole photo on a square panel, the Type label (uppercase, muted), the title in `font-heading`, a "From" price when Variants differ in price, a strikethrough only for a real compare-at price, and Sale and Sold out badges. A round quick-add button sits on the photo. [`CollectionCard`](src/components/CollectionCard.tsx) reuses the same card. [`ProductGrid`](src/components/ProductGrid.tsx) lays cards out in 3 columns, 2 at 1100px and below.

## Golden Glow System

The golden glow creates a soft under-lighting effect beneath glass panels:

### CSS Implementation

```scss
.golden-glow {
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    border-radius: inherit;
    box-shadow:
      0 16px 32px oklch(0.60 0.11 78 / 0.09),   /* inner shadow */
      0 0 48px oklch(0.60 0.11 78 / 0.05);       /* outer halo */
    opacity: var(--golden-glow-intensity, 1);
    transition: opacity 0.3s ease;
  }

  &:hover::after {
    box-shadow:
      0 16px 40px oklch(0.60 0.11 78 / 0.14),   /* intensified inner */
      0 0 64px oklch(0.60 0.11 78 / 0.08);       /* intensified outer */
    opacity: var(--golden-glow-hover-intensity, 1);
  }
}
```

### Components Using Golden Glow

| Component | Default | Override |
|-----------|---------|----------|
| [`OrnamentalBorder`](src/components/OrnamentalBorder.tsx) | Applied | `noGlow` prop |

## SCSS Mixins

### ornamental-surface

Creates complex multi-layered background patterns for ornamental surfaces:

```scss
@mixin ornamental-surface($goldDotOpacity, $tealLineOpacity, $goldLineOpacity, $withAmbient: false) {
  @if $withAmbient {
    background-image:
      repeating-radial-gradient(circle at 0 0, transparent 0, oklch(0.60 0.11 78 / #{$goldDotOpacity}) 2px, transparent 4px, transparent 40px),
      repeating-linear-gradient(45deg, oklch(0.45 0.08 210 / #{$tealLineOpacity}) 0px, ...),
      repeating-linear-gradient(-45deg, oklch(0.60 0.11 78 / #{$goldLineOpacity}) 0px, ...),
      radial-gradient(ellipse at 20% 30%, oklch(0.45 0.08 210 / 0.45) 0%, transparent 55%),
      radial-gradient(ellipse at 80% 70%, oklch(0.60 0.11 78 / 0.35) 0%, transparent 55%);
    background-size: 80px 80px, 120px 120px, 120px 120px, 800px 600px, 800px 600px;
  } @else {
    // Similar but without ambient radial gradients
  }
}
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `$goldDotOpacity` | Number | Opacity of gold dot pattern |
| `$tealLineOpacity` | Number | Opacity of teal diagonal lines |
| `$goldLineOpacity` | Number | Opacity of gold diagonal lines |
| `$withAmbient` | Boolean | Include ambient radial gradients |

## Typography System

### Font Families

| Role | Font | Usage |
|------|------|-------|
| Headings (H1-H6), `font-heading` | Noto Serif Display, self-hosted as `Mornii Display`, weight 400 (files in `src/assets/fonts/`, licence `OFL.txt`) | Section headers, titles |
| Body, `font-body` | Arial | Paragraph text, descriptions, buttons |
| Brand Accent, `font-script` | Great Vibes (Google Fonts) | "Mornii" only |

Cinzel, Cormorant Garamond and Inter are no longer used.

## Animation System

### Framer Motion Configuration

Shared animation constants in [`src/lib/animations.ts`](src/lib/animations.ts):

```typescript
// Premium easing: fast start, ultra-smooth deceleration
export const luxuryEase = [0.16, 1, 0.3, 1] as const

// Signature fade-up with blur clearing
export const fadeSlideUp = {
  hidden: { opacity: 0, y: 40, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.9, ease: luxuryEase } },
}

// Container for staggered children
export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, when: 'beforeChildren' } },
}

// Page transition for route changes
export const pageTransition = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}
```

### Animation Patterns

| Pattern | Duration | Trigger | Description |
|---------|----------|---------|-------------|
| Hero entrance | 800ms | Page load | Fade-up with stagger |
| Section reveal | 600ms | Viewport entry | Fade-up on scroll |
| Card hover | 300ms | Mouse enter | Lift + shadow + glow |
| Button hover | 200ms | Mouse enter | Shine effect |
| Page transition | 400ms | Route change | Blur-clearing fade |
| Ornamental border | 1200ms | Component mount | SVG stroke draw |

### Reduced Motion Support

A Shopper who asks for reduced motion gets no fades or slides:
- CSS: a `@media (prefers-reduced-motion: reduce)` block in [`src/index.scss`](src/index.scss) cuts every animation and transition to 0.01ms and sets `scroll-behavior: auto`.
- Framer Motion: `<MotionConfig reducedMotion="user">` in `src/main.tsx` removes transforms only. `followReducedMotion()` ([`src/lib/reduced-motion.ts`](src/lib/reduced-motion.ts)), called at startup, also sets `MotionGlobalConfig.skipAnimations` from the media query, so opacity fades stop too. It follows later changes to the setting.

## Focus Ring

Every control (`a`, `button`, `input`, `select`, `textarea`, `summary`, `[role='button']`, `[role='tab']`, `[tabindex]`) gets a two-tone ring on `:focus-visible` in [`src/index.scss`](src/index.scss): a 2px `--page-accent` (teal) outline, 2px out, over a 2px `--page-background` (champagne) box-shadow band. The teal reads on the page; the champagne band reads on teal buttons. Inside `.bar-teal` the two swap (`--bar-on-teal` outline, `--bar-teal` band). The ring appears at once (the `transition-property` list leaves out the outline). A `[role='dialog']` takes focus as a whole and draws no ring; the Bag dialog opens with focus on itself.

## Phone Touch Targets

At 768px and below (`@media (max-width: 768px)` in `src/index.scss`) every interactive element is at least 44x44px:
- `.pill-btn` has `min-height: 44px`.
- Every shadcn `[data-slot='button']` has `min-width` and `min-height` of 44px.
- Text inputs, `select` and `textarea` have `min-height: 44px` (checkboxes and radios are measured by their label).
- The Sheet and dialog close button is a 44px flex box at the top right.

Long text wraps: `.prose` and its descendants use `overflow-wrap: anywhere`, so a long word or link in a Product description cannot scroll the page sideways.

## Responsive Breakpoints

| Breakpoint | Width | Usage |
|-------------|-------|-------|
| Mobile | < 768px | Single column, compact spacing |
| Tablet | 768px - 1024px | Two columns, moderate spacing |
| Desktop | > 1024px | Three-four columns, generous spacing |

### Custom Breakpoints

```javascript
// tailwind.config.js
screens: {
  coarse: { raw: '(pointer: coarse)' },   // Touch devices
  fine: { raw: '(pointer: fine)' },       // Pointer devices
  pwa: { raw: '(display-mode: standalone)' }, // PWA mode
}
```

## Container and Spacing

| Token | Desktop | Mobile |
|-------|---------|--------|
| Container max-width | 1400px | 100% |
| Side padding | 80px (lg:px-20) | 24px |
| Section vertical spacing | 120px | 80px |
| Card gaps | 32px | 16px |

## Class Naming Conventions

| Pattern | Example | Purpose |
|---------|---------|---------|
| `glass-panel--*` | `glass-panel--flat` | BEM modifier for glass variants |
| `.golden-glow` | `.golden-glow` | Utility class for glow effect |
| `text-accent` | `text-accent` | Tailwind color token |
| `hover:text-accent` | `hover:text-accent` | Interactive state |
