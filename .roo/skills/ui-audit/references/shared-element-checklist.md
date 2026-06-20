# Shared Element Checklist

## Must-Use Components (No Duplicates)

| Element | Shared Component | Location |
|---------|-----------------|----------|
| Glass-morphism cards | `BaroqueCard` | `src/components/BaroqueCard.tsx` |
| Ornamental borders | `OrnamentalBorder` | `src/components/OrnamentalBorder.tsx` |
| Product images | `JewelryImage` | `src/components/JewelryImage.tsx` |
| Button variants | `Button` (shadcn) | `src/components/ui/button.tsx` |
| Dialog/modal | `Dialog` (shadcn) | `src/components/ui/dialog.tsx` |
| Dropdown menus | `DropdownMenu` (shadcn) | `src/components/ui/dropdown-menu.tsx` |
| Accordion/FAQ | `FAQAccordion` | `src/components/FAQAccordion.tsx` |

## Must-Use Utilities

| Utility | Location | Purpose |
|---------|----------|---------|
| `cn()` | `@/lib/utils.ts` | Conditional class merging |
| `getSiteConfig()` | `@/lib/siteConfig.ts` | Site metadata |
| `luxuryEase` | `src/lib/animations.ts` | Animation easing |

## Must-Use Hooks

| Hook | Location | Purpose |
|------|----------|---------|
| `useTheme()` | `src/hooks/useTheme.ts` | Theme toggle |
| `useSEO()` | `src/hooks/useSEO.ts` | SEO metadata |
| `useShopifyError()` | `src/hooks/useShopifyError.ts` | Shopify error handling |

## Centralization Rules

1. **No inline SVGs** — ornamental SVGs must use `src/assets/ornaments/header-ornament.svg`
2. **No hardcoded animations** — use `src/lib/animations.ts` exports
3. **No custom class merging** — always use `cn()` from `@/lib/utils.ts`
4. **No duplicate error boundaries** — use `ErrorBoundary` from `src/components/ErrorBoundary.tsx`
5. **No custom cart logic** — use `CartContext` from `src/context/CartContext.tsx`

## Audit Steps

1. Search for SVG elements defined inline in JSX — flag them
2. Check all `cubic-bezier()` values match `luxuryEase`
3. Verify every component uses `cn()` for className merging
4. Confirm no component reimplements cart logic or error handling
