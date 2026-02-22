import '@testing-library/jest-dom/vitest'

// Stub import.meta.env defaults for tests
// Individual tests can override with vi.stubEnv()
if (!import.meta.env.VITE_SHOPIFY_STORE_DOMAIN) {
  // @ts-expect-error — writable in test env
  import.meta.env.VITE_SHOPIFY_STORE_DOMAIN = ''
}
if (!import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN) {
  // @ts-expect-error — writable in test env
  import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN = ''
}
