import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

const shopifyFetch = vi.fn()
vi.mock('./client', () => ({
  IS_CONFIGURED: true,
  STOREFRONT_MODE: 'token',
  shopifyFetch: (...args: unknown[]) => shopifyFetch(...args),
}))

const { useShopBrand } = await import('./brand')
const { toShopBrand, BRAND_QUERY } = await import('./brand-query')

let queryClient: QueryClient
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

beforeEach(() => {
  shopifyFetch.mockReset()
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
})

describe('toShopBrand', () => {
  it('maps images to url, alt and size', () => {
    const brand = toShopBrand({
      shop: {
        brand: {
          logo: { image: { url: 'https://cdn/l.png', altText: 'Logo', width: 10, height: 20 } },
          squareLogo: { image: { url: 'https://cdn/s.png' } },
          coverImage: null,
        },
      },
    })
    expect(brand.logo).toEqual({ url: 'https://cdn/l.png', alt: 'Logo', width: 10, height: 20 })
    expect(brand.squareLogo).toEqual({ url: 'https://cdn/s.png', alt: '', width: null, height: null })
    expect(brand.coverImage).toBeNull()
  })

  it('returns nulls when Brand settings are empty', () => {
    expect(toShopBrand({ shop: { brand: null } })).toEqual({ logo: null, squareLogo: null, coverImage: null })
    expect(toShopBrand(undefined)).toEqual({ logo: null, squareLogo: null, coverImage: null })
  })

  it('queries shop.brand', () => {
    expect(BRAND_QUERY).toContain('brand')
    expect(BRAND_QUERY).toContain('squareLogo')
    expect(BRAND_QUERY).toContain('coverImage')
  })
})

describe('useShopBrand', () => {
  it('returns nulls while loading, then the brand', async () => {
    shopifyFetch.mockResolvedValue({ shop: { brand: { logo: { image: { url: 'https://cdn/l.png' } } } } })
    const { result } = renderHook(() => useShopBrand(), { wrapper })
    expect(result.current.logo).toBeNull()
    await waitFor(() => expect(result.current.logo?.url).toBe('https://cdn/l.png'))
    expect(result.current.coverImage).toBeNull()
  })

  it('stays null when the request fails', async () => {
    shopifyFetch.mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useShopBrand(), { wrapper })
    await new Promise((r) => setTimeout(r, 50))
    expect(result.current).toEqual({ logo: null, squareLogo: null, coverImage: null })
  })
})
