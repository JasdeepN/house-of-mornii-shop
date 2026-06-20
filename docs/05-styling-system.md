# Styling System

## Overview

The styling system combines Tailwind CSS 4 (without PostCSS), SCSS for complex mixins, and CSS custom properties for theming. The design language emphasizes luxury aesthetics with OKLCH color space, glass-morphism panels, and soft golden under-lighting effects.

```mermaid
graph TB
    subgraph SCSS["SCSS Layer (src/index.scss)"]
        Mixins[ornamental-surface mixin]
        Gradients[SVG gradient data URIs]
        Noise[Noise overlay pattern]
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

All colors use the OKLCH color space for perceptually uniform transitions and better accessibility:

### Dark Mode Palette (Default)

| Token | Value | Usage |
|-------|-------|-------|
| Background | `oklch(0.18 0.03 210)` | Body background |
| Card | `oklch(0.22 0.03 210)` | Glass panels, cards |
| Text (Foreground) | `oklch(0.95 0.01 210)` | Primary text |
| Muted | `oklch(0.60 0.01 210)` | Secondary text |
| Accent/Gold | `oklch(0.60 0.11 78)` | CTAs, highlights, ornamental details |
| Primary/Teal | `oklch(0.45 0.08 210)` | Brand color, gradients |

### Light Mode Palette

| Token | Value | Usage |
|-------|-------|-------|
| Background | `oklch(0.94 0.01 80)` | Body background (cream) |
| Text | `oklch(0.22 0.02 78)` | Primary text (dark brown-gold) |
| Accent/Gold | `oklch(0.60 0.11 78)` | Same as dark mode |

### Accessibility Ratios

| Pair | Ratio | WCAG |
|------|-------|------|
| Dark bg + Light text | 11.2:1 | AAA |
| Teal + White | 6.1:1 | AA |
| Gold + Dark slate | 7.8:1 | AAA |
| Card bg + Light text | 9.8:1 | AAA |

## CSS Custom Properties

### Glass Panel Variables

Defined in [`src/index.scss`](src/index.scss) for both dark and light modes:

**Dark Mode:**
```css
--glass-panel-bg: linear-gradient(160deg, oklch(0.18 0.03 210 / 0.55) ...);
--glass-blur-md: 24px;
--glass-saturate: 140%;
--glass-contrast: 108%;
--glass-panel-border: oklch(1 0 0 / 0.1);
--glass-highlight: oklch(1 0 0 / 0.15);
--glass-shadow: 0 12px 48px -16px oklch(0.28 0.03 210 / 0.14), ...;
```

**Light Mode:**
```css
--glass-panel-bg: linear-gradient(160deg, oklch(0.96 0.01 80 / 0.55) ...);
--glass-blur-md: 24px;
--glass-saturate: 140%;
--glass-contrast: 108%;
--glass-panel-border: oklch(0.60 0.11 78 / 0.18);
--glass-highlight: oklch(1 0 0 / 0.50);
--glass-shadow: 0 12px 48px -16px oklch(0.28 0.03 210 / 0.14), ...;
```

### Golden Glow Variables

Replaces the previous PNG ornamental border system (see [`GOLDEN_GLOW_GUIDE.md`](GOLDEN_GLOW_GUIDE.md)):

```css
/* Dark mode defaults */
--golden-glow-intensity: 0.12;
--golden-glow-hover-intensity: 0.22;

/* Light mode */
--golden-glow-intensity: 0.18;
--golden-glow-hover-intensity: 0.28;

/* Shared */
--golden-glow-color: oklch(0.60 0.11 78);
--golden-glow-spread: 16px;
--golden-glow-blur: 32px;
```

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
| [`BaroqueCard`](src/components/BaroqueCard.tsx) | Inherited | `noGlow` prop |
| [`ProductCard`](src/components/ProductCard.tsx) | Explicitly disabled | `noGlow` always |
| [`CollectionCard`](src/pages/CollectionsPage.tsx) | Explicitly disabled | `noGlow` always |

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

## SVG Gradient Backgrounds

Band-free backgrounds are implemented as SVG data URIs in SCSS variables:

```scss
$bg-dark-gradient: url("data:image/svg+xml,...");  // Dark mode gradient
$bg-light-gradient: url("data:image/svg+xml,..."); // Light mode gradient
$bg-noise: url("data:image/svg+xml,...");          // Film grain noise overlay
```

These are applied via `body::after` and `body::before` pseudo-elements for a seamless background that avoids CSS gradient banding.

## Typography System

### Font Families

| Role | Font | Usage |
|------|------|-------|
| Headings (H1-H6) | Bodoni Moda | Section headers, titles |
| Body | Cormorant Garamond | Paragraph text, descriptions |
| Brand Accent | Great Vibes | Script brand elements |

### Typography Hierarchy

| Level | Font | Size | Letter Spacing | Use Case |
|-------|------|------|----------------|----------|
| H1 | Cinzel Bold | 48px | 0.05em | Brand name |
| H2 | Cinzel Regular | 36px | 0.08em | Section headers |
| H3 | Cinzel Regular | 28px | 0.12em | Collection names |
| Body | Cormorant Garamond | 18px | relaxed (1.6) | Descriptions |
| Buttons | Cormorant SemiBold | 16px | uppercase + 0.15em | CTAs |

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

All animations respect `prefers-reduced-motion: reduce`:
- CSS transitions disabled via media query
- Framer Motion reduced motion mode enabled globally

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
