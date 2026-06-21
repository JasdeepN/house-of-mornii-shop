import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('STOREFRONT_MODE and IS_CONFIGURED', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('throws when env vars are empty (no demo mode)', async () => {
    vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', '')
    vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', '')
    await expect(import('./client')).rejects.toThrow(
      'VITE_SHOPIFY_STORE_DOMAIN is not set',
    )
  })

  it('throws when domain is CHANGE_ME placeholder', async () => {
    vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', 'CHANGE_ME')
    vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', 'some-token')
    await expect(import('./client')).rejects.toThrow(
      'still set to placeholder value: CHANGE_ME',
    )
  })

  it('throws when domain is the example placeholder', async () => {
    vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', 'your-store.myshopify.com')
    vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', 'some-token')
    await expect(import('./client')).rejects.toThrow(
      'still set to placeholder value: your-store.myshopify.com',
    )
  })

  it('throws when domain is set but token is absent', async () => {
    vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', 'test-store.myshopify.com')
    vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', '')
    await expect(import('./client')).rejects.toThrow(
      'VITE_SHOPIFY_STOREFRONT_TOKEN is not set',
    )
  })

  it('returns token mode when both domain and token are present', async () => {
    vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', 'test-store.myshopify.com')
    vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', 'shpat_abc123')
    const { IS_CONFIGURED, STOREFRONT_MODE } = await import('./client')
    expect(IS_CONFIGURED).toBe(true)
    expect(STOREFRONT_MODE).toBe('token')
  })
})

describe('shopifyFetch', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('throws at module load time when credentials missing (no demo mode)', async () => {
    vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', '')
    await expect(import('./client')).rejects.toThrow(
      'VITE_SHOPIFY_STORE_DOMAIN is not set',
    )
  })

  it('makes a POST request to the correct endpoint in token mode', async () => {
    vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', 'test-store.myshopify.com')
    vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', 'test-token-123')

    // Mock the SDK client's request method
    const mockRequest = vi.fn().mockResolvedValue({
      data: { shop: { name: 'Test' } },
    })
    vi.doMock('./sdk-client', () => ({
      storefrontClient: { request: mockRequest },
      IS_SDK_CONFIGURED: true,
    }))

    const { shopifyFetch } = await import('./client')
    const result = await shopifyFetch('{ shop { name } }')

    expect(result).toEqual({ shop: { name: 'Test' } })
  })

  it('throws "Unexpected storefront mode" when SDK is undefined in token mode', async () => {
    vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', 'test-store.myshopify.com')
    vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', 'test-token-123')

    vi.doMock('./sdk-client', () => ({
      storefrontClient: undefined,
      IS_SDK_CONFIGURED: false,
    }))

    const { shopifyFetch } = await import('./client')
    await expect(shopifyFetch('{ shop { name } }')).rejects.toThrow(
      'Unexpected storefront mode',
    )
  })

  it('throws StorefrontError with not_found on GraphQL errors containing "not found" (SDK)', async () => {
    vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', 'test-store.myshopify.com')
    vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', 'test-token-123')

    const mockRequest = vi.fn().mockResolvedValue({
      errors: {
        graphQLErrors: [{ message: 'Field not found' }],
      },
    })
    vi.doMock('./sdk-client', () => ({
      storefrontClient: { request: mockRequest },
      IS_SDK_CONFIGURED: true,
    }))

    const { shopifyFetch, StorefrontError } = await import('./client')
    const err: any = await shopifyFetch('{ badQuery }').catch((e: any) => e)
    expect(err).toBeInstanceOf(StorefrontError)
    // "Field not found" contains "not found" so category is 'not_found'
    expect(err.category).toBe('not_found')
    expect(err.message).toContain('Field not found')
  })

  it('throws StorefrontError with query_error on GraphQL errors without "not found" (SDK)', async () => {
    vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', 'test-store.myshopify.com')
    vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', 'test-token-123')

    const mockRequest = vi.fn().mockResolvedValue({
      errors: {
        graphQLErrors: [{ message: 'Internal server error' }],
      },
    })
    vi.doMock('./sdk-client', () => ({
      storefrontClient: { request: mockRequest },
      IS_SDK_CONFIGURED: true,
    }))

    const { shopifyFetch, StorefrontError } = await import('./client')
    const err: any = await shopifyFetch('{ badQuery }').catch((e: any) => e)
    expect(err).toBeInstanceOf(StorefrontError)
    expect(err.category).toBe('query_error')
    expect(err.message).toContain('Internal server error')
  })
  
  describe('adminProxyFetch', () => {
    beforeEach(() => {
      vi.resetModules()
      vi.restoreAllMocks()
    })
  
    afterEach(() => {
      vi.unstubAllEnvs()
    })
  
    it('throws on non-200 response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response)
  
      const { adminProxyFetch } = await import('./admin-proxy')
      await expect(
        adminProxyFetch({ query: '{ shop { name } }' })
      ).rejects.toThrow('Admin API proxy error: 500 Internal Server Error')
    })
  
    it('throws on GraphQL errors from proxy', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: null,
          errors: [{ message: 'Field not found' }],
        }),
      } as Response)
  
      const { adminProxyFetch } = await import('./admin-proxy')
      await expect(
        adminProxyFetch({ query: '{ badQuery }' })
      ).rejects.toThrow('Admin API GraphQL errors: Field not found')
    })
  
    it('returns data on successful response', async () => {
      const expectedData = { shop: { name: 'Test Store' } }
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: expectedData }),
      } as Response)
  
      const { adminProxyFetch } = await import('./admin-proxy')
      const result = await adminProxyFetch({ query: '{ shop { name } }' })
      expect(result).toEqual(expectedData)
    })
  })
  
  describe('withRetry', () => {
    it('returns immediately on success', async () => {
      const { withRetry } = await import('./retry')
      const result = await withRetry(async () => 'success')
      expect(result).toBe('success')
    })
  
    it('retries on TypeError and eventually succeeds', async () => {
      const { withRetry } = await import('./retry')
      let attempts = 0
      const fn = async () => {
        attempts++
        if (attempts < 3) throw new TypeError('Network error')
        return 'recovered'
      }
      const result = await withRetry(fn, { maxAttempts: 3 })
      expect(result).toBe('recovered')
      expect(attempts).toBe(3)
    })
  
    it('throws after maxAttempts exhausted', async () => {
      const { withRetry } = await import('./retry')
      let attempts = 0
      const fn = async () => {
        attempts++
        throw new TypeError('Persistent error')
      }
      await expect(withRetry(fn, { maxAttempts: 2 })).rejects.toThrow('Persistent error')
      expect(attempts).toBe(2)
    })
  
    it('does not retry on non-retryable Error', async () => {
      const { withRetry } = await import('./retry')
      let attempts = 0
      const fn = async () => {
        attempts++
        const err = new Error('Query error') as Error & { statusCode?: number }
        err.statusCode = 400
        throw err
      }
      await expect(withRetry(fn, { maxAttempts: 3 })).rejects.toThrow('Query error')
      expect(attempts).toBe(1)
    })
  })
  it('retries on network error (TypeError)', async () => {
    vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', 'test-store.myshopify.com')
    vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', 'test-token-123')

    let callCount = 0
    const mockRequest = vi.fn().mockImplementation(async () => {
      callCount++
      if (callCount < 2) throw new TypeError('Network error')
      return { data: { shop: { name: 'Retried' } } }
    })
    vi.doMock('./sdk-client', () => ({
      storefrontClient: { request: mockRequest },
      IS_SDK_CONFIGURED: true,
    }))

    const { shopifyFetch } = await import('./client')
    const result = await shopifyFetch('{ shop { name } }')
    expect(result).toEqual({ shop: { name: 'Retried' } })
    expect(callCount).toBe(2)
  })
})

