import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// We need to mock @shopify/storefront-api-client
vi.mock('@shopify/storefront-api-client', () => ({
  createStorefrontApiClient: vi.fn(),
}))

describe('sdk-client', () => {
  const originalDomain = process.env.VITE_SHOPIFY_STORE_DOMAIN
  const originalToken = process.env.VITE_SHOPIFY_STOREFRONT_TOKEN

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // Restore original env values
    if (originalDomain !== undefined) {
      vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', originalDomain)
    }
    if (originalToken !== undefined) {
      vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', originalToken)
    }
  })

  describe('createClient', () => {
    it('returns undefined when domain is missing', async () => {
      vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', '')
      vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', 'test-token')

      const { storefrontClient, IS_SDK_CONFIGURED } = await import('./sdk-client')

      expect(storefrontClient).toBeUndefined()
      expect(IS_SDK_CONFIGURED).toBe(false)
    })

    it('returns undefined when token is missing', async () => {
      vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', 'test-store.myshopify.com')
      vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', '')

      const { storefrontClient, IS_SDK_CONFIGURED } = await import('./sdk-client')

      expect(storefrontClient).toBeUndefined()
      expect(IS_SDK_CONFIGURED).toBe(false)
    })

    it('returns undefined when domain is "your-store.myshopify.com" placeholder', async () => {
      vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', 'your-store.myshopify.com')
      vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', 'test-token')

      const { storefrontClient, IS_SDK_CONFIGURED } = await import('./sdk-client')

      expect(storefrontClient).toBeUndefined()
      expect(IS_SDK_CONFIGURED).toBe(false)
    })

    it('returns undefined when domain is "CHANGE_ME" placeholder', async () => {
      vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', 'CHANGE_ME')
      vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', 'test-token')

      const { storefrontClient, IS_SDK_CONFIGURED } = await import('./sdk-client')

      expect(storefrontClient).toBeUndefined()
      expect(IS_SDK_CONFIGURED).toBe(false)
    })

    it('creates a client when both domain and token are valid', async () => {
      const mockClient = { send: vi.fn() }
      const { createStorefrontApiClient } = await import('@shopify/storefront-api-client')
      ;(createStorefrontApiClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient)

      vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', 'test-store.myshopify.com')
      vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', 'test-token')

      const { storefrontClient, IS_SDK_CONFIGURED } = await import('./sdk-client')

      expect(createStorefrontApiClient).toHaveBeenCalledWith({
        storeDomain: 'test-store.myshopify.com',
        apiVersion: '2026-01',
        publicAccessToken: 'test-token',
      })
      expect(storefrontClient).toBe(mockClient)
      expect(IS_SDK_CONFIGURED).toBe(true)
    })

    it('returns undefined when both domain and token are missing', async () => {
      vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', '')
      vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', '')

      const { storefrontClient, IS_SDK_CONFIGURED } = await import('./sdk-client')

      expect(storefrontClient).toBeUndefined()
      expect(IS_SDK_CONFIGURED).toBe(false)
    })
  })
})
