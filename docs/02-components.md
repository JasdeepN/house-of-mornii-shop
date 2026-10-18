# Component Library

## Overview

The component library is organized into two tiers: application-specific UI components in `src/components/` and headless accessible primitives wrapped from Radix UI in `src/components/ui/`. All components follow a consistent pattern using Tailwind CSS for styling, Framer Motion for animations, and TypeScript for type safety.

## Component Hierarchy

```mermaid
graph TD
    subgraph Primitives["Radix UI Primitives (src/components/ui/)"]
        Dialog[Dialog/Sheet]
        Dropdown[DropdownMenu]
        Accordion[Accordion]
        Tooltip[Tooltip]
        Form[Form/Input/Label]
        Card[Card]
        Button[Button]
    end

    subgraph Application["Application Components (src/components/)"]
        Header[Header]
        Footer[Footer]
        CartFlyout[CartFlyout]
        ProductCard[ProductCard]
        JewelryImage[JewelryImage]
        OrnamentalBorder[OrnamentalBorder]
        BaroqueCard[BaroqueCard]
        VariantSelector[VariantSelector]
        SearchBar[SearchBar]
        NewsletterSignup[NewsletterSignup]
        WelcomePopup[WelcomePopup]
        HeroSection[HeroSection]
        CollectionsSection[CollectionsSection]
        ProductGrid[ProductGrid]
        TrustBadges[TrustBadges]
        QuickAddDialog[QuickAddDialog]
        CollectionCard[CollectionCard]
        ProductListingLayout[ProductListingLayout]
        AddToCartButton[AddToCartButton]
        ScrollToHash[ScrollToHash]
        PageTransition[PageTransition]
        EnvironmentWarning[EnvironmentWarning]
    end

    Primitives --> Application
```

## Layout Components

### [`ScrollToHash`](src/components/ScrollToHash.tsx)

Utility component that scrolls to hash fragment on page load.

**Props:** None

### [`PageTransition`](src/components/PageTransition.tsx)

Framer Motion wrapper for route transition animations.

**Props:** `children: ReactNode`

### [`EnvironmentWarning`](src/components/EnvironmentWarning.tsx)

Displays a warning banner when Shopify credentials are missing in production.

**Props:** None

### [`Header`](src/components/Header.tsx)

Fixed navigation header styled with `.bar-teal` (teal, champagne text, square corners), responsive mobile menu, and cart badge.

**Props:** None (uses context internally)

**Key Features:**
- Fixed position at top of viewport (`z-index: 50`)
- Glass panel background with `glass-panel` class
- Responsive: desktop nav links vs. mobile Sheet drawer
- Cart badge showing item count
- Theme toggle (dark/light mode)
- Brand lockup as home link

**Navigation Links:**
| Label | Route |
|-------|-------|
| SHOP | `/shop` |
| COLLECTIONS | `/collections` |
| ABOUT | `/about` |
| CONTACT | `/contact` |

**Desktop Extra Buttons:**
- Theme toggle (dark/light)
- SearchBar (Cmd+K / Ctrl+K)
- Cart button with badge
- "BOOK A STYLING" CTA linking to `/contact`

**Mobile Menu:**
- Navigation links
- "BOOK A STYLING" button at bottom

**Usage:**
```tsx
// Rendered automatically in App.tsx
import { Header } from '@/components/Header'
```

### [`Footer`](src/components/Footer.tsx)

Site footer with brand lockup, trust badges, a Policies group, an optional newsletter signup, and copyright. Styled with `.bar-teal` (teal, champagne text, square corners), like the Header.

**Props:** None (uses context internally)

**Key Features:**
- Ornamental divider between sections
- TrustBadges component (compact variant)
- Policies group: a `nav` (`aria-label="Policies"`) linking Refund policy, Shipping policy, Privacy policy and Terms of service to `/policies/refund`, `/policies/shipping`, `/policies/privacy` and `/policies/terms`
- NewsletterSignup renders only when `getNewsletterConfig().enabled` is true (`VITE_NEWSLETTER_ENABLED=true`); it is off until v1.1
- Dynamic copyright year
- Tagline "REGAL · RADIANT · MODERN"

### [`CartFlyout`](src/components/CartFlyout.tsx)

Slide-out cart drawer (Sheet) that appears when user opens cart from any page.

**Props:** None (uses `useCart()` context internally)

**Key Features:**
- Controlled by `isCartOpen` state from CartContext
- Displays cart items with images, quantities, prices
- Debounced quantity adjustment per line item (300ms debounce)
- Remove line item functionality
- Cart subtotal display
- Checkout button linking to Shopify checkout URL (validates URL)
- Closes when clicking outside or pressing Escape

## Product Components

### [`AddToCartButton`](src/components/AddToCartButton.tsx)

Product detail page button for adding items to cart with loading states.

**Props:**
```typescript
interface AddToCartButtonProps {
  variantId: string
  availableForSale: boolean
  productTitle: string
  productPrice: string
  currencyCode?: string
  className?: string
  compact?: boolean
}
```

**Key Features:**
- Loading spinner state during add-to-cart operation
- Analytics tracking via `trackAddToCart()`
- Error handling with toast notification
- "SOLD OUT" disabled state when unavailable
- Compact mode for smaller layouts

### [`ProductCard`](src/components/ProductCard.tsx)

The Product card (layout C), used on listing pages, the homepage and related Products.

**Props:**
```typescript
interface ProductCardProps {
  product: ProductSummary
  index?: number        // For staggered animation delay
}
```

**Key Features:**
- `React.memo` wrapped with custom comparison function to prevent unnecessary re-renders
- Whole photo on a square panel; a second photo shows on hover when the Product has one
- Type label, title in `font-heading`, price
- "From" price when Variants differ in price; strikethrough only for a real compare-at price
- Sale and Sold out badges
- Round quick-add button driven by `product.quickAdd`: `add` (one Variant) adds it and opens the Cart; `choose` (several Variants) opens [`QuickAddDialog`](src/components/QuickAddDialog.tsx); `sold-out` disables it
- Links to `/products/:handle`
- Framer Motion entrance (`duration: 0.6`, delay `index * 0.12`, viewport-triggered)

### [`QuickAddDialog`](src/components/QuickAddDialog.tsx)

Dialog that lets a Shopper pick a Variant of a Product with several, then adds it to the Cart and opens the Cart.

**Props:** `product: ProductSummary`, `open: boolean`, `onOpenChange: (open: boolean) => void`

**Key Features:**
- Loads the Product's Variants with `useProduct` when opened
- Shows loading and error states
- Tracks add-to-cart; shows a toast when the add fails

### [`CollectionCard`](src/components/CollectionCard.tsx)

A Collection as the Product card looks, without price, quick add or badges.

**Props:** `collection: CollectionSummary`, `media?: ReactNode` (replaces the photo for Collections with an illustration)

### [`ProductGrid`](src/components/ProductGrid.tsx)

Grid layout for Product cards.

**Props:**
```typescript
interface ProductGridProps {
  products: ProductSummary[]
  className?: string
}
```

**Key Features:**
- 3 columns, 2 at 1100px and below
- Empty state handling ("No products found in this collection.")

### [`ProductListingLayout`](src/components/ProductListingLayout.tsx)

Shared layout for `ShopPage` and `CollectionPage`: title, optional breadcrumb and intro, filters, and a `ProductGrid`.

**Props:** `title`, `breadcrumb?`, `intro?`, `products` (the whole listing), `isLoading`, `error?`, `filters: ListingFilters`, `onFiltersChange`

**Key Features:**
- Sticky sidebar with Type counts, Hide sold out and a sort; a chip row on phones
- Six sorts (`PRODUCT_SORTS`): Recommended, Newest, Price low to high, Price high to low, Name A-Z, Name Z-A
- Filter state lives in the URL: `type`, `available=1`, `sort`; defaults are left out, so Back and Forward restore the list. Product pages link back to the same list
- Rules live in the Catalog module (`src/lib/shopify/catalog.ts`): `parseListingFilters`, `withListingFilters`, `viewListing`

### [`JewelryImage`](src/components/JewelryImage.tsx)

SVG illustration component for collection placeholders (not actual product images).

**Props:**
```typescript
interface JewelryImageProps {
  collection: 'everyday' | 'festive' | 'bridal'
  className?: string
}
```

**Key Features:**
- Renders unique SVG jewelry illustrations per collection
- Everyday: pearl pendant with gold chain
- Festive: emerald jewel with gold setting
- Bridal: multi-pearl arrangement with gold accents
- Radial gradient backgrounds specific to each collection

### [`VariantSelector`](src/components/VariantSelector.tsx)

Product variant selection UI for multi-option products.

**Props:**
```typescript
interface VariantSelectorProps {
  product: ShopifyProduct
  selectedVariant: ShopifyProductVariant | null
  onVariantChange: (variant: ShopifyProductVariant) => void
}
```

**Key Features:**
- Renders option groups (e.g., Color, Size) as text buttons
- Disabled state for unavailable variants (opacity + line-through)
- Selected state highlighting with accent border
- Returns null when only one variant exists

## Decorative Components

### [`OrnamentalBorder`](src/components/OrnamentalBorder.tsx)

Decorative wrapper component applying golden under-glow and ornamental styling.

**Props:**
```typescript
interface OrnamentalBorderProps {
  children: ReactNode
  className?: string
  noGlow?: boolean          // Disable golden glow effect (renamed from noBorder)
}
```

**Key Features:**
- Applies `.golden-glow` class by default for CSS box-shadow under-lighting
- `noGlow` prop disables the glow effect
- Padding via CSS custom properties (`--ornamental-frame-pad-*`)
- Uses SCSS mixin `ornamental-surface` for complex background patterns

**Usage:**
```tsx
<OrnamentalBorder>
  <Content />
</OrnamentalBorder>

<OrnamentalBorder noGlow>
  <ContentWithoutGlow />
</OrnamentalBorder>
```

### [`BaroqueCard`](src/components/BaroqueCard.tsx)

Generic card wrapper (not the Product card; see `ProductCard`) wrapping content with ornamental styling and optional animations.

**Sub-components:**
- `BaroqueCardHeader` - Card header section
- `BaroqueCardTitle` - Title typography
- `BaroqueCardDescription` - Description/subtitle text
- `BaroqueCardContent` - Main content area
- `BaroqueCardFooter` - Footer actions

**Props (Root):**
```typescript
interface BaroqueCardProps {
  children: ReactNode
  className?: string
  noGlow?: boolean          // Disable golden glow
  hoverable?: boolean       // Enable hover elevation effects
  animate?: boolean         // Enable entrance animation
}
```

**Key Features:**
- Uses `OrnamentalBorder` internally
- Optional hover state with shadow increase
- Entrance animation support via Framer Motion
- Flexible sub-component composition

## Form Components

### [`SearchBar`](src/components/SearchBar.tsx)

Product search input with debounced query submission.

**Props:**
```typescript
interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
}
```

**Key Features:**
- Debounced input (prevents excessive re-renders)
- Clear button to reset search
- Accessible with proper ARIA labels
- Icon integration (search icon)

### [`NewsletterSignup`](src/components/NewsletterSignup.tsx)

Email subscription form supporting multiple providers. Hidden at launch: the Footer shows it only when `VITE_NEWSLETTER_ENABLED=true`, which stays off until v1.1.

**Props:**
```typescript
interface NewsletterSignupProps {
  className?: string
}
```

**Key Features:**
- Reads endpoint from `VITE_NEWSLETTER_ENDPOINT` env var
- Falls back to prototype mode when endpoint is empty
- Loading state with spinner
- Success/error toast feedback
- Accessible form with proper labels

## Page Section Components

### [`HeroSection`](src/components/HeroSection.tsx)

Full-viewport hero with brand identity and mood navigation.

**Props:** None (uses env vars for configuration)

**Key Features:**
- Brand lockup display
- Tagline "REGAL · RADIANT · MODERN"
- Mood-based shopping categories (Everyday, Festive, Bridal)
- CTA buttons linking to Shop/Collections
- Entrance animation with staggered children

### [`CollectionsSection`](src/components/CollectionsSection.tsx)

Collection showcase grid for homepage display.

**Props:**
```typescript
interface CollectionsSectionProps {
  collections: ShopifyCollection[]
}
```

**Key Features:**
- Responsive grid layout
- Collection cards with images and titles
- Links to `/collections/:handle`
- Staggered entrance animation

### [`FAQAccordion`](src/components/FAQAccordion.tsx)

Collapsible FAQ section using Radix Accordion.

**Props:**
```typescript
interface FAQAccordionProps {
  items: { question: string; answer: string }[]
}
```

### [`TrustBadges`](src/components/TrustBadges.tsx)

Trust signals. The only badge is "Secure Checkout"; shipping, returns and authenticity claims were removed.

**Props:**
```typescript
interface TrustBadgesProps {
  variant?: 'full' | 'compact'
  className?: string
}
```

**Key Features:**
- `full` variant: grid layout with icons, labels, and subtitles
- `compact` variant: inline labels for footer use
- Includes `PaymentIcons` sub-component for payment method badges (Visa, Mastercard, Amex, Apple Pay, Google Pay)

## Utility Components

### [`PageBreadcrumb`](src/components/PageBreadcrumb.tsx)

Breadcrumb navigation for SEO and user orientation with structured data.

**Props:**
```typescript
interface PageBreadcrumbProps {
  items: BreadcrumbItem[]  // { label: string; to?: string }
  className?: string
  centered?: boolean
}
```

**Key Features:**
- Generates JSON-LD breadcrumb schema automatically
- Framer Motion slide-in animation
- Links to parent pages via `to` prop

### [`PolicyPage`](src/pages/PolicyPage.tsx)

One of the store's own policies, written by the owner in Shopify and shown as-is. Routes: `/policies/refund`, `/policies/shipping`, `/policies/privacy`, `/policies/terms`.

**Props:** `{ kind: 'refund' | 'shipping' | 'privacy' | 'terms' }`

**Key Features:**
- Reads the policy with `usePolicy(kind)` and renders its title and HTML body; the body goes through `sanitizeRichText`
- Breadcrumb, `h1` and ornamental divider; the document title comes from the policy
- Loading state, then either the body or "This policy hasn't been published yet." with a Contact link
- A failed request shows "We couldn't load this policy. Please try again shortly." with the same link

### [`NotFoundPage`](src/pages/NotFoundPage.tsx)

The catch-all route (`path="*"` in `src/App.tsx`) for unknown addresses.

**Key Features:**
- "Page not found" heading with links to Shop and Home
- Calls `useSEO({ noindex: true })`, which adds `robots: noindex, follow` while the page is mounted

### [`ProductGallery`](src/components/ProductGallery.tsx)

Multi-image gallery for product detail pages.

**Props:**
```typescript
interface ProductGalleryProps {
  images: ShopifyImage[]
  title: string
}
```

**Key Features:**
- Main image with hover zoom effect
- Thumbnail strip with scroll
- Selected image border highlight

### [`BrandLockup`](src/components/BrandLockup.tsx)

Brand logo lockup with typography and optional ornamentation.

**Props:**
```typescript
interface BrandLockupProps {
  size?: 'sm' | 'lg' | 'xl'
  className?: string
}
```

**Key Features:**
- Three sizes: 'sm' (navbar), 'lg' (section headers), 'xl' (hero)
- "House of" in uppercase tracking + "Mornii" in script font

### [`JsonLd`](src/components/JsonLd.tsx)

Structured data component for SEO schema markup.

**Props:**
```typescript
interface JsonLdProps {
  data: Record<string, unknown>
}
```

**Usage:**
```tsx
<JsonLd data={organizationSchema()} />
```

### [`WelcomePopup`](src/components/WelcomePopup.tsx)

Session-based welcome modal shown once per session.

**Props:** None (reads config from env vars via `getWelcomePopupConfig()`)

**Key Features:**
- Shows after 4-second delay on first visit
- Uses `sessionStorage` with key `hom_welcome_shown` to track visibility
- Newsletter signup integration (`source="welcome-popup"`)
- Dismissible with close button
- Respects `prefers-reduced-motion`
- Radix Dialog with z-index 60/61 overlay

### [`FAQAccordion`](src/components/FAQAccordion.tsx)

Collapsible FAQ section using Radix Accordion with hardcoded content.

**Props:**
```typescript
interface FAQAccordionProps {
  className?: string
}
```

**Key Features:**
- Hardcoded FAQ items (5 questions about materials, care, shipping, returns, bespoke)
- Single collapsible accordion type

## UI Primitives (Radix Wrappers)

Located in `src/components/ui/`, these components wrap Radix UI primitives with consistent Tailwind styling:

| Component | Radix Primitive | Purpose |
|-----------|-----------------|---------|
| [`accordion.tsx`](src/components/ui/accordion.tsx) | `@radix-ui/react-accordion` | Collapsible content sections |
| [`alert.tsx`](src/components/ui/alert.tsx) | Custom | Alert banners with variants |
| [`alert-dialog.tsx`](src/components/ui/alert-dialog.tsx) | `@radix-ui/react-alert-dialog` | Confirmation dialogs |
| [`button.tsx`](src/components/ui/button.tsx) | Custom | Styled button with variants |
| [`card.tsx`](src/components/ui/card.tsx) | Custom | Card container components |
| [`dialog.tsx`](src/components/ui/dialog.tsx) | `@radix-ui/react-dialog` | Modal dialogs |
| [`sheet.tsx`](src/components/ui/sheet.tsx) | `@radix-ui/react-dialog` | Side drawer panels |
| [`dropdown-menu.tsx`](src/components/ui/dropdown-menu.tsx) | `@radix-ui/react-dropdown-menu` | Context menus |
| [`input.tsx`](src/components/ui/input.tsx) | Custom | Styled text inputs |
| [`label.tsx`](src/components/ui/label.tsx) | `@radix-ui/react-label` | Form labels |
| [`select.tsx`](src/components/ui/select.tsx) | `@radix-ui/react-select` | Dropdown select |
| [`tabs.tsx`](src/components/ui/tabs.tsx) | `@radix-ui/react-tabs` | Tab navigation |
| [`tooltip.tsx`](src/components/ui/tooltip.tsx) | `@radix-ui/react-tooltip` | Hover tooltips |
| [`separator.tsx`](src/components/ui/separator.tsx) | `@radix-ui/react-separator` | Visual dividers |

All primitives follow the shadcn-style pattern: headless Radix behavior with Tailwind CSS styling applied via className props. They use `class-variance-authority` for variant management and `tailwind-merge` for className collision resolution.

## Custom Hooks (Component-Level)

### [`useSEO`](src/hooks/useSEO.ts)

Dynamically updates document title, meta tags, and canonical URL.

**Usage:**
```tsx
function ProductPage() {
  useSEO({
    title: 'Aria Pendant',
    description: 'Delicate teardrop pendant...',
    image: '/products/aria-pendant.jpg',
    type: 'product',
  })
}
```

### [`useTheme`](src/hooks/useTheme.ts)

Always returns the light theme (v1.0 is light only); `toggleTheme` is a no-op and stored preferences are ignored.

**Returns:**
```typescript
{
  theme: 'light'
  toggleTheme: () => void
}
```

### [`useIsMobile`](src/hooks/use-mobile.ts)

Responsive breakpoint hook for mobile detection.

**Returns:** `boolean` - `true` when viewport is below desktop threshold

### [`useShopifyError`](src/hooks/useShopifyError.ts)

Categorizes Shopify API errors for appropriate UI handling.

**Returns:** Error category string for conditional rendering
