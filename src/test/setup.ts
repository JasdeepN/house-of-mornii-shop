import '@testing-library/jest-dom/vitest'

// Polyfill IntersectionObserver for jsdom (required by framer-motion)
if (typeof IntersectionObserver === 'undefined') {
  global.IntersectionObserver = class IntersectionObserver {
    readonly root: Element | null = null
    readonly rootMargin: string = ''
    readonly thresholds: ReadonlyArray<number> = []
    constructor(private callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] { return [] }
  } as unknown as typeof globalThis.IntersectionObserver
}

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
// Mark as test environment for siteConfig.ts
// @ts-expect-error — writable in test env
import.meta.env.VITEST = 'true'
