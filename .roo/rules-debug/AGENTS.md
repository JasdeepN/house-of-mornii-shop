# Debug Mode Rules (Non-Obvious Only)

This file provides debugging-specific guidance for AI assistants working with this repository.

## Environment & Configuration

- **Mode detection**: `STOREFRONT_MODE` from `@/lib/shopify/client` is always `'token'`. There is no demo or tokenless mode — the app throws on startup if credentials are missing/placeholder.
- **Production build guard**: `vite.config.ts` aborts production builds (`process.exit(1)`) if `VITE_SHOPIFY_STORE_DOMAIN` or `VITE_SHOPIFY_STOREFRONT_TOKEN` is missing or set to a placeholder (`your-store.myshopify.com`, `CHANGE_ME`). Dev deploys (`DEPLOY_ENV=dev`) skip this check.
- **Admin API proxy**: When `VITE_SHOPIFY_ADMIN_PROXY_ENABLED=true`, hooks route through `/api/shopify/admin` (Cloudflare Worker). The Worker blocks mutations via regex `/\bmutation\b/i`.

## Testing Gotchas

- **IntersectionObserver & ResizeObserver**: Patched in `src/test/setup.ts` for jsdom (required by framer-motion and radix-ui ScrollArea).
- **Env var stubbing**: `import.meta.env` Shopify vars stubbed to valid dummy credentials (`test-store.myshopify.com`, `test-storefront-token`) — NOT empty strings — in `src/test/setup.ts`, since `client.ts` throws on missing values. Individual tests can override with `vi.stubEnv()`.
- **Test files**: Vitest config includes both `src/**/*.test.{ts,tsx}` and `workers/**/*.test.{ts,tsx}`. Run a single test: `npx vitest run src/lib/shopify/client.test.ts`.

## Common Debug Scenarios

1. **Shopify not loading**: Check that `VITE_SHOPIFY_STORE_DOMAIN` and `VITE_SHOPIFY_STOREFRONT_TOKEN` are set in `.env.local` (not `.env.example`). The app throws immediately if they're missing or placeholder values.
2. **Cart not persisting**: Verify `hom-cart-id` in localStorage. Cart is restored on mount via `CART_QUERY` mutation.
3. **Welcome popup not showing**: Check sessionStorage for `hom_welcome_shown`.
4. **Search not working**: Cmd+K (macOS) or Ctrl+K (Windows) opens SearchBar, not a separate page.
5. **Admin API proxy failing**: Verify the Cloudflare Worker is running (`wrangler dev`) and `VITE_SHOPIFY_ADMIN_PROXY_ENABLED=true` in `.env.local`. The Vite dev server proxies `/api/shopify/*` to `localhost:8787`.
6. **Newsletter in prototype mode**: If `VITE_NEWSLETTER_ENDPOINT` is empty, `subscribeToNewsletter()` returns `{ mode: 'prototype' }` immediately without making a network request.
