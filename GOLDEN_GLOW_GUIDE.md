# Soft Golden Glow System

## Overview

The ornamental PNG border has been replaced with a soft golden under-lighting effect that creates an elegant warm glow beneath glass panels throughout the site. This approach is more performant, scales better across devices, and provides a subtle ambient lighting feel consistent with luxury branding.

## How It Works

### CSS Variables (defined in [`src/index.scss`](src/index.scss))

```css
/* Light mode defaults */
--golden-glow-color: oklch(0.60 0.11 78);       /* gold hue */
--golden-glow-intensity: 0.18;                    /* base opacity */
--golden-glow-spread: 16px;                       /* vertical spread */
--golden-glow-blur: 32px;                         /* blur radius */
--golden-glow-hover-intensity: 0.28;              /* hover intensity */
```

### Utility Class: `.golden-glow`

Apply to any element to add the golden under-glow:

```tsx
<div className="glass-panel golden-glow">
  {/* content */}
</div>
```

#### Behavior

- **Default state**: Subtle golden glow (`opacity: 0.18`)
- **Hover state**: Intensified glow (`opacity: 0.28`) with wider blur
- **Reduced motion**: Transitions disabled for `prefers-reduced-motion: reduce`

## Component Usage

### OrnamentalBorder

The main component now applies `.golden-glow` by default:

```tsx
import { OrnamentalBorder } from '@/components/OrnamentalBorder'

// With glow (default)
<OrnamentalBorder>
  <Content />
</OrnamentalBorder>

// Without glow
<OrnamentalBorder noGlow>
  <Content />
</OrnamentalBorder>
```

### BaroqueCard

Uses [`OrnamentalBorder`](src/components/OrnamentalBorder.tsx:18) internally:

```tsx
import { BaroqueCard } from '@/components/BaroqueCard'

// With glow (default)
<BaroqueCard hoverable>
  <ProductInfo />
</BaroqueCard>

// Without glow
<BaroqueCard noGlow>
  <ProductInfo />
</BaroqueCard>
```

## Customization

To adjust the glow intensity globally, modify these values in [`src/index.scss`](src/index.scss):

```scss
.golden-glow {
  &::after {
    box-shadow:
      0 16px 32px oklch(0.60 0.11 78 / 0.09),   /* inner shadow */
      0 0 48px oklch(0.60 0.11 78 / 0.05);       /* outer halo */
    opacity: var(--golden-glow-intensity, 1);     // change base intensity here
  }

  &:hover::after {
    box-shadow:
      0 16px 40px oklch(0.60 0.11 78 / 0.14),    /* intensified inner */
      0 0 64px oklch(0.60 0.11 78 / 0.08);        /* intensified outer */
    opacity: var(--golden-glow-hover-intensity, 1); // change hover intensity here
  }
}
```

## Migration Notes

### What Changed

| Before | After |
|--------|-------|
| PNG border-image (`Borders-tight.png`) | CSS `box-shadow` golden glow |
| `noBorder` prop on OrnamentalBorder/BaroqueCard | `noGlow` prop |
| Fixed-width ornamental frame (50px) | Soft under-panel glow |

### Breaking Changes

- **Prop rename**: `noBorder` → `noGlow` on both [`OrnamentalBorder`](src/components/OrnamentalBorder.tsx:18) and [`BaroqueCard`](src/components/BaroqueCard.tsx:39)
- **Asset removal**: `src/assets/images/Borders-tight.png` deleted — no longer imported anywhere

### Affected Components

All components using BaroqueCard or OrnamentalBorder automatically inherit the new glow effect:

- [`HeroSection.tsx`](src/components/HeroSection.tsx:24) - Hero card with glow
- [`ProductCard.tsx`](src/components/ProductCard.tsx:48) - Product cards without glow (explicitly set `noGlow`)
- [`CollectionsPage.tsx`](src/pages/CollectionsPage.tsx:71) - Collection cards without glow (explicitly set `noGlow`)
- [`CollectionsSection.tsx`](src/components/CollectionsSection.tsx:67) - Collection section cards without glow (explicitly set `noGlow`)

## Performance Benefits

1. **No image loading** — CSS box-shadow is GPU-accelerated
2. **Reduced bundle size** — PNG file removed from assets
3. **Better responsiveness** — Glow scales naturally with container dimensions
4. **Consistent rendering** — No border-image stretching artifacts across browsers
