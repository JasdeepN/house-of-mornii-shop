# Demo Asset Bundling Guide

## Overview

The demo data in [`src/lib/shopify/demo-data.ts`](../src/lib/shopify/demo-data.ts) currently uses external placeholder images from `placehold.co`:

```typescript
function placeholder(w: number, h: number, label: string) {
  return {
    url: `https://placehold.co/${w}x${h}/1a1a2e/c4a35a?text=${encodeURIComponent(label)}`,
    altText: label,
    width: w,
    height: h,
  }
}
```

## Why Bundle Locally?

External placeholder services introduce:
- **Network dependency**: Demo mode fails if placehold.co is down
- **Inconsistent loading**: Slow networks cause delayed image rendering
- **Brand mismatch**: Placeholder colors may not match brand identity
- **Privacy concerns**: External requests leak development environment info

## Bundling Process

### Step 1: Create Asset Directory

```bash
mkdir -p public/assets/placeholders
```

### Step 2: Generate Placeholder Images

Create simple SVG placeholders that match the brand aesthetic (dark background `#1a1a2e`, gold accent `#c4a35a`):

**File**: `public/assets/placeholders/product-800x800.svg`
```xml
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">
  <rect width="800" height="800" fill="#1a1a2e"/>
  <text x="400" y="400" text-anchor="middle" dominant-baseline="middle" 
        fill="#c4a35a" font-family="serif" font-size="24">House of Mornii</text>
</svg>
```

### Step 3: Update Demo Data

**File**: `src/lib/shopify/demo-data.ts`

Replace the external URL generation with local asset paths:

```typescript
// Before (external):
function placeholder(w: number, h: number, label: string) {
  return {
    url: `https://placehold.co/${w}x${h}/1a1a2e/c4a35a?text=${encodeURIComponent(label)}`,
    altText: label,
    width: w,
    height: h,
  }
}

// After (local):
function placeholder(filename: string) {
  return {
    url: `/assets/placeholders/${filename}`,
    altText: filename.replace('.svg', '').replace('-', ' '),
    width: 800,
    height: 800,
  }
}

// Update demoProduct calls:
demoProduct(
  'Aria Pendant',
  'aria-pendant',
  '89.00',
  'A delicate teardrop pendant...',
  ['everyday', 'pendant', 'gold'],
) // → placeholder('product-jewelry-1.svg')
```

### Step 4: Create Variant Placeholders

Create multiple SVG variants for visual variety:
- `product-jewelry-1.svg` — Generic jewelry silhouette
- `product-jewelry-2.svg` — Pendant/necklace shape
- `product-jewelry-3.svg` — Ring shape
- `product-jewelry-4.svg` — Earring shape
- `collection-everyday.svg` — Everyday collection banner
- `collection-festive.svg` — Festive collection banner
- `collection-bridal.svg` — Bridal collection banner

### Step 5: Verify Offline Functionality

```bash
npm run dev
# Disconnect network, verify all demo images load
```

## Alternative: Data URI Embedding

For very simple placeholders, consider embedding as data URIs to eliminate HTTP requests entirely:

```typescript
const PLACEHOLDER_SVG = `data:image/svg+xml,...` // Base64 encoded SVG
```

This approach is best for minimal placeholder designs but increases bundle size slightly.

## Related Documentation

- [Remediation Plan](./remediation-plan.md) — Phase 4 backlog item
- [Demo Mode Developer Guide](./demo-mode-developer-guide.md)
