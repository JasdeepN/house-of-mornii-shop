# Debug Mode Rules (Non-Obvious Only)

This file provides debugging-specific guidance for AI assistants working with this repository.

## Environment & Configuration

- **Mode detection**: Check `STOREFRONT_MODE` from `@/lib/shopify/client` — returns `'demo'`, `'tokenless'`, or `'token'`.
- **Production demo mode**: App throws error via `process.exit(1)` — never deploy without credentials.
- **Tokenless mode**: Only token-safe fields available (no tags, metafields, customer APIs).

## Testing Gotchas

- **IntersectionObserver**: Patched in `src/test/setup.ts` for jsdom (required by framer-motion).
- **Env var stubbing**: `import.meta.env` Shopify vars stubbed to empty strings in test setup.
- **Demo mode for tests**: All hook tests force demo mode via `vi.mock('./client')`.

## Common Debug Scenarios

1. **Shopify not loading**: Check `IS_CONFIGURED` — if false, app uses demo data.
2. **Cart not persisting**: Verify `hom-cart-id` in localStorage.
3. **Welcome popup not showing**: Check sessionStorage for `hom_welcome_shown`.
4. **Search not working**: Cmd+K/Ctrl+K opens SearchBar, not a separate page.
