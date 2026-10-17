import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { validateEnv } from './env-schema'

describe('env-schema', () => {
  const originalDomain = process.env.VITE_SHOPIFY_STORE_DOMAIN
  const originalToken = process.env.VITE_SHOPIFY_STOREFRONT_TOKEN

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (originalDomain !== undefined) {
      vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', originalDomain)
    } else {
      vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', '')
    }
    if (originalToken !== undefined) {
      vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', originalToken)
    } else {
      vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', '')
    }
  })

  describe('validateEnv', () => {
    it('returns mode "token" and empty errors when all required vars are present', async () => {
      vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', 'test-store.myshopify.com')
      vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', 'test-token')

      const { validateEnv } = await import('./env-schema')
      const result = validateEnv()

      expect(result.mode).toBe('token')
      expect(result.errors).toEqual([])
    })

    it('returns error when VITE_SHOPIFY_STORE_DOMAIN is missing', async () => {
      vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', '')
      vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', 'test-token')

      const { validateEnv } = await import('./env-schema')
      const result = validateEnv()

      expect(result.mode).toBe('token')
      expect(result.errors).toContain('VITE_SHOPIFY_STORE_DOMAIN is required')
    })

    it('returns error when VITE_SHOPIFY_STOREFRONT_TOKEN is missing', async () => {
      vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', 'test-store.myshopify.com')
      vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', '')

      const { validateEnv } = await import('./env-schema')
      const result = validateEnv()

      expect(result.mode).toBe('token')
      expect(result.errors).toContain('VITE_SHOPIFY_STOREFRONT_TOKEN is required')
    })

    it('returns errors for both missing vars', async () => {
      vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', '')
      vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', '')

      const { validateEnv } = await import('./env-schema')
      const result = validateEnv()

      expect(result.mode).toBe('token')
      expect(result.errors).toHaveLength(2)
      expect(result.errors).toContain('VITE_SHOPIFY_STORE_DOMAIN is required')
      expect(result.errors).toContain('VITE_SHOPIFY_STOREFRONT_TOKEN is required')
    })

    it('always returns mode "token" regardless of errors', async () => {
      vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', '')
      vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', '')

      const { validateEnv } = await import('./env-schema')
      const result = validateEnv()

      expect(result.mode).toBe('token')
    })

    it('accepts optional env vars without errors', async () => {
      vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', 'test-store.myshopify.com')
      vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', 'test-token')

      const { validateEnv } = await import('./env-schema')
      const result = validateEnv()

      expect(result.mode).toBe('token')
      expect(result.errors).toEqual([])
    })
  })
})
