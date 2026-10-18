# Testing Strategy

## Overview

The application uses a three-tier testing approach: Vitest for unit/integration tests, Playwright for end-to-end browser tests, and manual verification for visual/design validation.

```mermaid
graph TB
    subgraph Unit["Unit Tests - Vitest"]
        Components[Component tests]
        Hooks[Hook tests]
        Lib[Library/utility tests]
        Types[Type tests]
    end

    subgraph E2E["E2E Tests - Playwright"]
        ReadOnly[Read-only tier]
        DevOnly[Dev-only tier: Orders and sign-in]
    end

    subgraph CI["CI Pipeline"]
        DevDeploy[After every dev deploy]
        PR[PR verification]
    end

    Unit --> CI
    E2E --> CI
```

## Vitest (Unit/Integration Tests)

### Configuration

Tests are configured in [`vitest.config.ts`](vitest.config.ts) with:
- jsdom environment for React component testing
- `@/` path alias resolution via `__dirname`
- Global setup file at `src/test/setup.ts`

### Setup File

The [`src/test/setup.ts`](src/test/setup.ts) file provides essential polyfills and stubs:

```typescript
import '@testing-library/jest-dom/vitest'

// Polyfill IntersectionObserver for framer-motion in jsdom
if (typeof IntersectionObserver === 'undefined') {
  global.IntersectionObserver = class IntersectionObserver { /* ... */ }
}

// Stub Shopify env vars with valid dummy credentials (client.ts throws on empty/missing values)
if (!import.meta.env.VITE_SHOPIFY_STORE_DOMAIN) {
  import.meta.env.VITE_SHOPIFY_STORE_DOMAIN = 'test-store.myshopify.com'
}
if (!import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN) {
  import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN = 'test-storefront-token'
}

// Mark test environment for siteConfig.ts
import.meta.env.VITEST = 'true'
```

### Test Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `npm run test` | `vitest` | Watch mode with interactive UI |
| `npm run test:run` | `vitest run` | Single run (CI mode) |

### Running Individual Tests

```bash
npx vitest run src/lib/shopify/client.test.ts
npx vitest run src/components/Header.test.tsx
npx vitest run src/context/CartContext.test.tsx
```

### Test File Locations

Test files live alongside their source files with `.test.ts` or `.test.tsx` suffix:

| Test File | Tests |
|-----------|-------|
| [`src/lib/shopify/client.test.ts`](src/lib/shopify/client.test.ts) | Credential resolution, error classification |
| [`src/lib/shopify/hooks.test.tsx`](src/lib/shopify/hooks.test.tsx) | Query hook behavior (mocked `shopifyFetch` + fixtures) |
| [`src/lib/shopify/types.test.ts`](src/lib/shopify/types.test.ts) | Type helper functions |
| [`src/components/Header.test.tsx`](src/components/Header.test.tsx) | Header rendering, navigation |
| [`src/components/CartFlyout.test.tsx`](src/components/CartFlyout.test.tsx) | Cart drawer interactions |
| [`src/components/AddToCartButton.test.tsx`](src/components/AddToCartButton.test.tsx) | Add to cart flow |
| [`src/components/NewsletterSignup.test.tsx`](src/components/NewsletterSignup.test.tsx) | Newsletter form submission |
| [`src/components/SearchBar.test.tsx`](src/components/SearchBar.test.tsx) | Search input behavior |
| [`src/context/CartContext.test.tsx`](src/context/CartContext.test.tsx) | Cart state management |
| [`src/lib/analytics.test.ts`](src/lib/analytics.test.ts) | Analytics tracking |
| [`src/lib/animations.test.ts`](src/lib/animations.test.ts) | Animation constants |
| [`src/lib/cart.test.ts`](src/lib/cart.test.ts) | Cart utilities |
| [`src/lib/newsletter.test.ts`](src/lib/newsletter.test.ts) | Newsletter handler |
| [`src/pages/CollectionPage.test.tsx`](src/pages/CollectionPage.test.tsx) | Collection page rendering |
| [`src/pages/ShopPage.test.tsx`](src/pages/ShopPage.test.tsx) | Shop page rendering |

### Testing Library Setup

Tests use `@testing-library/react` and `@testing-library/jest-dom`:

```typescript
import { render, screen, fireEvent } from '@/test/utils'
import '@testing-library/jest-dom/vitest'

describe('ProductCard', () => {
  it('renders product title and price', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByText('Aria Pendant')).toBeInTheDocument()
    expect(screen.getByText('$89.00')).toBeInTheDocument()
  })
})
```

### Test Utilities

The [`src/test/utils.tsx`](src/test/utils.tsx) file provides shared test helpers:

```typescript
// Custom render with providers
export function renderWithProviders(ui, options = {}) {
  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <CartProvider>{children}</CartProvider>
      </QueryClientProvider>
    ),
    ...options,
  })
}
```

### Mocking Strategy

#### Shopify API Mocking

Tests mock the Shopify client to avoid real API calls:

```typescript
import { vi } from 'vitest'
import * as client from '@/lib/shopify/client'

vi.spyOn(client, 'shopifyFetch').mockResolvedValue(mockData)
```

#### Customer Account API Mocking

Customer pages and hooks reach the Customer Account API only through `customerFetch` from the `@/lib/customer` barrel. Tests mock that one function, as Catalog tests mock `shopifyFetch`:

```typescript
import { vi } from 'vitest'
import * as customer from '@/lib/customer'

vi.spyOn(customer, 'customerFetch').mockResolvedValue(data)
// A signed-out Customer: reject with SignedOutError
```

`makeWrapper()` and `stubSession('in' | 'out' | 'network-error')` in `src/lib/customer/test-utils.tsx` set up the Query client, the `CustomerSessionProvider` and the session state. A `SignedOutError` from any query or mutation moves the Customer session to `signed-out`.

#### Customer Session Worker Testing

`workers/customer-session.test.ts` drives the Worker through `worker.fetch(new Request(...), env)`. The env holds an in-memory KV (`MemoryKV`, a `Map` behind `get`/`put`/`delete`) and test values for `SHOP_ID`, `CLIENT_ID`, `APP_ORIGIN` and `API_VERSION`. A stubbed global `fetch` (`vi.stubGlobal('fetch', ...)`) stands in for Shopify. Tests assert on the `Response`: redirect parameters, `Set-Cookie` attributes, 401s, token renewal and the KV contents. Run it with `npx vitest run workers/customer-session.test.ts`.

#### Environment Variable Mocking

Tests can override environment variables using `vi.stubEnv()`:

```typescript
vi.stubEnv({
  VITE_SHOPIFY_STORE_DOMAIN: 'test-store.myshopify.com',
  VITE_SHOPIFY_STOREFRONT_TOKEN: 'test-token',
})
```

#### IntersectionObserver Mocking

The global setup file provides an IntersectionObserver polyfill required by Framer Motion in jsdom.

## Playwright (E2E Tests)

The end-to-end suite has two tiers, `e2e/read-only` (safe anywhere) and `e2e/dev-only` (real test Orders and sign-in; dev only). It tests a deployed site, by default https://dev.houseofmornii.com, and runs after every `dev` deploy. Journeys, setup, secrets and troubleshooting are in [16 - End-to-End Tests](./16-end-to-end-tests.md).

| Script | Purpose |
|--------|---------|
| `npm run test:e2e` | Both tiers, against dev |
| `npm run test:e2e:read-only` | Read-only tier only |
| `npm run test:e2e:ui` | Interactive Playwright UI |
| `npm run test:e2e:report` | Open the HTML report |
| `npm run e2e:session` | Refresh the saved test Customer session |

Sign-in is covered by `e2e/dev-only/sign-in.spec.ts`: the signed-out journey reaches Shopify's hosted sign-in page and stops, and the signed-in journey uses the saved Customer session. The Worker's unit tests cover everything behind that page.

## Test Coverage Goals

| Layer | Target | Current Status |
|-------|--------|----------------|
| Unit (Vitest) | >80% | Key modules covered |
| E2E (Playwright) | Critical paths | Shop, Product, Bag, checkout and sign-in journeys covered |
| Visual | Manual | Design review process |

## Testing Patterns

### Component Testing Pattern

```typescript
describe('ProductCard', () => {
  const mockProduct: ShopifyProduct = {
    id: 'gid://shopify/Product/1',
    handle: 'aria-pendant',
    title: 'Aria Pendant',
    // ... full mock data
  }

  it('renders product information', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByText('Aria Pendant')).toBeInTheDocument()
    expect(screen.getByText('$89.00')).toBeInTheDocument()
  })

  it('navigates to product page on click', async () => {
    const user = userEvent.setup()
    render(<ProductCard product={mockProduct} />)
    await user.click(screen.getByRole('link'))
    expect(window.location.pathname).toBe('/products/aria-pendant')
  })
})
```

### Hook Testing Pattern

```typescript
describe('useCollections', () => {
  it('returns demo data when not configured', async () => {
    const { result } = renderHook(() => useCollections())
    await waitFor(() => result.current.isSuccess)
    expect(result.current.data).toHaveLength(3)
  })
})
```

### Context Testing Pattern

```typescript
describe('CartContext', () => {
  it('adds items to cart', async () => {
    render(<TestComponent />) // TestComponent uses useCart()
    const button = screen.getByText('Add to Cart')
    await userEvent.click(button)
    expect(screen.getByText('Added to cart')).toBeInTheDocument()
  })
})
```

## Visual Testing

Visual/design validation is performed manually:

1. **Theme toggle**: Verify dark/light mode transitions
2. **Responsive layout**: Test at various viewport sizes
3. **Animation quality**: Check Framer Motion animations
4. **Golden glow**: Verify under-lighting effect on hover
5. **Glass panels**: Confirm backdrop blur rendering

## Continuous Integration

### CI Pipeline Steps

```mermaid
flowchart LR
    PR[Pull Request] --> Lint[ESLint]
    Lint --> Test[Vitest]
    Test --> Build[Vite Build]
    Build --> E2E[Playwright E2E]
    E2E --> Merge[Merge or Fail]
```

### Environment Variables in CI

CI pipelines should set:
- `VITE_SHOPIFY_STORE_DOMAIN` - For integration testing
- `VITE_SHOPIFY_STOREFRONT_TOKEN` - For full API coverage
- `CI=true` - Enables CI-specific test behavior
