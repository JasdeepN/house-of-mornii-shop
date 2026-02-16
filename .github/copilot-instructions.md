# House of Mornii - AI Agent Instructions

## Project Overview

A luxury jewelry showcase built with React + TypeScript + Vite, featuring ornate baroque aesthetics for House of Mornii brand. Assets (frames, ornaments, illustrations) are pre-generated and imported; no runtime AI or client persistence.

## Critical Architecture Patterns

### Build Tooling & Icons
- **Vite Plugins**: `react()` and `tailwindcss()` only; no Spark plugins required.
- **Icons**: Use `@phosphor-icons/react` imports directly (no proxy needed).

### Color System (OKLCH Only)
- **Never use hex/rgb**: All colors MUST use OKLCH format: `oklch(lightness chroma hue)`
- **Brand Colors** (defined in [PRD.md](PRD.md#L90-L100)):
  - Primary Teal: `oklch(0.45 0.08 210)`
  - Antique Gold: `oklch(0.60 0.11 78)` - refined, muted gold (NOT bright)
  - Dark Background: `oklch(0.15 0.02 210)`
  - Card Background: `oklch(0.22 0.03 210)`
- **Access via CSS Variables**: Use Tailwind classes like `bg-accent`, `text-accent` which map to theme variables
- **Custom Colors**: Always use inline style with OKLCH: `style={{ color: 'oklch(0.60 0.11 78)' }}`

### Ornamental Border System
- **Component**: [OrnamentalBorder.tsx](src/components/OrnamentalBorder.tsx) wraps content with baroque frames
- **Current Asset**: Uses PNG border at `src/assets/images/Borders.png` (NOT SVG)
- **Layered Background**: Component generates complex radial/linear gradient patterns for texture
- **Usage Pattern**:
  ```tsx
  <OrnamentalBorder className="...">
    <div className="text-center space-y-6">
      {/* Content appears above border with proper z-indexing */}
    </div>
  </OrnamentalBorder>
  ```
- **Padding**: Border has responsive padding `p-12 md:p-16 lg:p-20` - adjust content sizing accordingly
- **See Also**: [BAROQUE_BORDER_GUIDE.md](BAROQUE_BORDER_GUIDE.md) for detailed integration guide

### Component Structure
- **Section Components**: [HeroSection](src/components/HeroSection.tsx), [CollectionsSection](src/components/CollectionsSection.tsx), [AboutSection](src/components/AboutSection.tsx), [ContactSection](src/components/ContactSection.tsx)
- **Main App**: [App.tsx](src/App.tsx) composes sections in single-page layout with Header/Footer
- **UI Components**: shadcn/ui in `src/components/ui/` - DO NOT modify these directly, extend via className prop
- **State Colocation**: Keep component state local; there is no shared/persistent client store in use

## Typography & Design Language

### Font Stack (Google Fonts)
- **Headings**: Cinzel (serif) - uppercase, wide letter-spacing (0.12-0.15em)
- **Body**: Cormorant Garamond (serif) - 18px, line-height 1.6
- **Script Accent**: Great Vibes (script) - brand "Mornii" only
- **Classes**: Use `font-script` for Great Vibes, default is Cormorant

### Design Philosophy
- **Regal Opulence**: Every element should feel luxurious but refined, not flashy
- **Peacock Motifs**: Subtle integration of peacock feather imagery
- **Gradient Backgrounds**: Layer radial gradients for depth (see [HeroSection.tsx](src/components/HeroSection.tsx#L20-L36))
- **Ornamental Details**: Use SVG ornaments from `src/assets/ornaments/` for dividers, corners, accents

## Key Developer Workflows

### Development
```bash
npm run dev          # Start Vite dev server on http://localhost:5173
npm run build        # TypeScript compile + Vite build
npm run preview      # Preview production build
npm run optimize     # Vite dependency optimization
```

### Static Asset Generation Pattern
- **Philosophy**: All images (borders, jewelry, ornaments) are generated ONCE using AI, saved as PNG/SVG, then imported
- **Workflow**: 
  1. Create detailed prompt with baroque/rococo style + OKLCH colors
  2. Generate via DALL-E/Midjourney outside the app
  3. Save high-res PNG to `src/assets/images/`
  4. Import and use: `import asset from '@/assets/images/asset-name.png'`
- **Example**: Baroque border generated once, saved as `Borders.png`, used in `OrnamentalBorder.tsx`
- **Note**: `JewelryImage` and `GenerateAsset` components were temporary development tools, not production features

### Adding New Collections
1. Update `collections` array in [CollectionsSection.tsx](src/components/CollectionsSection.tsx#L8-L30)
2. Add collection type to `JewelryImage` component
3. Create corresponding gradient (format: `from-{color}/opacity to-transparent`)
4. Ensure `JewelryImage` has an illustration/gradient variant for the collection (static SVGs today)

## Theming System

### Tailwind Configuration
- **v4 Setup**: Uses new `@import "tailwindcss"` CSS import (not classic config)
- **Config File**: [tailwind.config.js](tailwind.config.js) extends with Radix color scales
- **Theme CSS**: [src/styles/theme.css](src/styles/theme.css) imports all Radix color palettes
- **Custom Properties**: Access via `var(--color-accent-9)`, `var(--color-neutral-12)`, etc.

### Responsive Breakpoints
- Standard Tailwind: `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px)
- **Custom**: `coarse:` (touch), `fine:` (mouse), `pwa:` (standalone mode)

## Integration Points & External Deps

### Core Dependencies
- **@radix-ui/***: Headless UI primitives (accordion, dialog, dropdown, etc.)
- **@phosphor-icons/react**: Icon library
- **framer-motion**: Animations (use `motion.*` components + `useInView` hook)
- **tailwindcss**: v4.x - CSS-first configuration
- **sonner**: Toast notifications (imported as `toast` from 'sonner')

### Path Aliases
- **@/\***: Maps to `src/*` (configured in [vite.config.ts](vite.config.ts#L22-L24))
- Example: `import { Button } from '@/components/ui/button'`

## Critical Conventions

### File Naming
- Components: PascalCase.tsx (e.g., `HeroSection.tsx`)
- Utilities: kebab-case.ts (e.g., `use-mobile.ts`)
- Assets: kebab-case with descriptive names (e.g., `baroque-border.png`)

### Component Patterns
- **Props Interface**: Always define inline or above component
  ```tsx
  interface ComponentProps {
    children: ReactNode
    className?: string
  }
  ```
- **className Merging**: Use `cn()` utility from `@/lib/utils` for conditional classes
- **Motion Animations**: Use staggered delays (0.15-0.2s) for list items, `duration: 0.8` for elegance

### Accessibility
- **ARIA Labels**: Add to decorative images (`alt=""` for ornaments)
- **Keyboard Nav**: Ensure all interactive elements are focusable
- **Color Contrast**: All text/bg pairings meet WCAG AA (ratios documented in [PRD.md](PRD.md#L97-L101))

## Documentation References

- **Product Requirements**: [PRD.md](PRD.md) - complete feature specs, color palette, typography
- **Baroque Border Guide**: [BAROQUE_BORDER_GUIDE.md](BAROQUE_BORDER_GUIDE.md) - border asset creation & usage
- **Integration Summary**: [INTEGRATION_SUMMARY.md](INTEGRATION_SUMMARY.md) - recent changes, border integration
- **Ornament Assets**: [src/assets/ornaments/README.md](src/assets/ornaments/README.md) - SVG ornament catalog

## Common Pitfalls

1. **Don't use bright gold**: The accent gold is muted (`oklch(0.60 0.11 78)`), not `#FFD700`
2. **Don't forget z-index layering**: OrnamentalBorder uses absolute positioning - content needs `relative z-10`
3. **Don't modify shadcn/ui component files**: Extend via className prop or create wrapper components
4. **Don't use hex colors**: Project exclusively uses OKLCH for color consistency
5. **Don't skip animation delays**: Stagger for polish (see [CollectionsSection.tsx](src/components/CollectionsSection.tsx#L61))
