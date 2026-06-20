# Demo Mode Developer Guide

Demo mode is an explicit development state — not a fallback or accident. This document explains when it is active, what it provides, and the guards that prevent it from reaching production.

## What Is Demo Mode

Demo mode (`STOREFRONT_MODE === 'demo'`) activates when `VITE_SHOPIFY_STORE_DOMAIN` is absent, empty, or set to a known placeholder value (`your-store.myshopify.com`, `CHANGE_ME`).

In demo mode the app:

- Renders a complete, visually accurate storefront using fixture product/collection data (`src/lib/shopify/demo-data.ts`)
- Makes **zero** calls to the Shopify Storefront API
- Supports local cart operations entirely in-memory (no persistence between page reloads)
- Logs a console warning on dev server startup indicating credentials are missing

## When To Use It

| Scenario | Appropriate? |
|----------|--------------|
| Local development before a dev store is provisioned | Yes |
| Sharing a UI mockup / design review build | Yes |
| CI test runs (unit tests, component tests) | Yes — Vitest setup stubs env vars to empty strings, which activates demo mode |
| Production deployment | **Never** — the app will refuse to start in production without credentials (see below) |

## Production Guard

`src/main.tsx` runs a check before the React tree mounts:

```ts
if (import.meta.env.PROD && STOREFRONT_MODE === 'demo') {
  // Render a static misconfiguration screen
  // Throw to prevent the full React app from mounting
}
```

A production build (`npm run build`) in demo mode will compile successfully, but the resulting deployment will display a "Storefront Not Configured" screen to every visitor rather than serving fixture products. This is intentional — it makes a misconfigured deployment visibly broken rather than silently wrong.

**Never deploy to production without valid credentials.** See [shopify-auth-mode-setup.md](./shopify-auth-mode-setup.md) for how to configure them.

## In-Memory Cart Behaviour

The cart in demo mode is held in React state inside `CartProvider`. It resets on page refresh. This means:

- Add-to-cart works and the cart flyout updates correctly
- Persistence across sessions is not tested in demo mode
- Checkout navigation renders a `#` URL (`href="#"`) since no Shopify cart ID exists

To test real checkout flows, configure `token` or `tokenless` mode against a development store.

## Demo Fixture Data

Fixture products and collections live in `src/lib/shopify/demo-data.ts`. The data is kept close to a realistic Shopify response shape to catch query shape regressions before live testing.

When adding a new query field that is required in live mode, add a counterpart to the demo fixture so demo mode continues to render correctly without a live store.

## Console Warnings

In `DEV` mode, the console will print:

```
[House of Mornii] Shopify credentials not configured — running in demo mode.
Copy .env.example → .env.local and add your store domain + token.
```

No warning is printed in `PROD` — the production guard throws before any logging occurs.

## Activating Demo Mode Intentionally

To force demo mode locally even with credentials present, pass empty values in your development shell:

```bash
VITE_SHOPIFY_STORE_DOMAIN= VITE_SHOPIFY_STOREFRONT_TOKEN= npm run dev
```

Or create a `.env.demo` file and load it explicitly — Vite loads `.env.local` by default so an empty `.env.demo` will not override it unless sourced manually.

## Related Files

| File | Purpose |
|------|---------|
| `src/lib/shopify/client.ts` | Mode resolution (`resolveStorefrontMode`), console warnings |
| `src/lib/shopify/demo-data.ts` | Fixture products, collections, variants |
| `src/lib/shopify/hooks.ts` | `IS_CONFIGURED` fallback branches in every data-fetching hook |
| `src/context/CartContext.tsx` | In-memory cart for demo mode |
| `src/main.tsx` | Production guard |
| `src/test/setup.ts` | Vitest env stub that activates demo mode in tests |
