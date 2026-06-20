# Typography Guidelines

## Font Family Hierarchy

| Element | Font | Weight | Size |
|---------|------|--------|------|
| H1 (Brand Name) | Cinzel | Bold | 48px |
| H2 (Section Headers) | Cinzel | Bold | 36px |
| H3 (Card/Component Titles) | Cinzel | Bold | 28px |
| H4 (Sub-sections) | Bodoni Moda | SemiBold | 24px |
| Body Text | Cormorant Garamond | Regular | 18px |
| Small Text / Captions | Inter | Regular | 14px |
| Button Text | Cinzel | Medium | 16px |

## Font Loading

Fonts are loaded in [`src/index.scss`](../../../src/index.scss):
- Cinzel: Google Fonts (display)
- Cormorant Garamond: Google Fonts (body)
- Inter: Google Fonts (UI elements)

## Size Scale

All font sizes must use this scale (no arbitrary values):

```
48px → H1
36px → H2
28px → H3
24px → H4
18px → Body
16px → Button / Large
14px → Small / Caption
12px → Tiny (rare)
```

## Audit Steps

1. Search all `.tsx` files for `text-[...px]` patterns — flag any non-standard sizes
2. Check font-family declarations match the hierarchy above
3. Verify no component defines its own font stack
4. Ensure responsive scaling uses Tailwind's `md:`, `lg:` breakpoints consistently
