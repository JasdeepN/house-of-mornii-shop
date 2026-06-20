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

// Polyfill ResizeObserver for jsdom (required by radix-ui ScrollArea)
if (typeof ResizeObserver === 'undefined') {
  global.ResizeObserver = class ResizeObserver {
    constructor(_callback: ResizeObserverCallback) {}
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

// Polyfill window.matchMedia for jsdom (required by some UI libraries)
if (typeof window.matchMedia === 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: function matchMedia(query: string) {
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {}, // deprecated
        removeListener: () => {}, // deprecated
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }
    },
  })
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
