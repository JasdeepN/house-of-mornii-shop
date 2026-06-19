import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderWithProviders } from '@/test/utils'
import { ShopPage } from './ShopPage'

const trackViewItemList = vi.fn()
const mockUseCollections = vi.fn()
const mockUseCollection = vi.fn()
const mockUseProducts = vi.fn()

vi.mock('@/hooks/useSEO', () => ({
  useSEO: vi.fn(),
}))

vi.mock('@/lib/analytics', () => ({
  trackViewItemList: (...args: unknown[]) => trackViewItemList(...args),
}))

vi.mock('@/lib/shopify', async () => {
  const actual = await vi.importActual<'@/lib/shopify'>('@/lib/shopify')
  return {
    ...(actual as Record<string, unknown>),
    useProducts: (...args: unknown[]) => mockUseProducts(...args),
    useCollections: (...args: unknown[]) => mockUseCollections(...args),
    useCollection: (...args: unknown[]) => mockUseCollection(...args),
    shopifyFetch: vi.fn(),
    IS_CONFIGURED: false,
    STOREFRONT_MODE: 'demo',
    StorefrontError: class StorefrontError extends Error {
      category = 'misconfigured'
    },
    getDemoProducts: vi.fn(() => []),
  }
})

function createProducts(handles: string[]) {
  return {
    edges: handles.map((handle, index) => ({
      cursor: `cursor-${handle}`,
      node: {
        id: `gid://shopify/Product/${handle}`,
        handle,
        title: `Product ${index + 1}`,
        priceRange: {
          minVariantPrice: { amount: `${index + 1}.00`, currencyCode: 'CAD' },
          maxVariantPrice: { amount: `${index + 1}.00`, currencyCode: 'CAD' },
        },
        tags: [],
      },
    })),
    pageInfo: { hasNextPage: false, endCursor: null },
  }
}

describe('ShopPage analytics', () => {
  beforeEach(() => {
    trackViewItemList.mockReset()
    mockUseCollections.mockReset()
    mockUseCollection.mockReset()
    mockUseProducts.mockReset()
    mockUseCollections.mockReturnValue({ data: [], isLoading: false, error: null })
    mockUseCollection.mockReturnValue({ data: null, isLoading: false, error: null })
  })

  it('refires view_item_list tracking when the product list changes', () => {
    let productsData = createProducts(['aria-pendant'])
    mockUseProducts.mockImplementation(() => ({ data: productsData, isLoading: false, error: null }))

    const { rerender } = renderWithProviders(<ShopPage />, { initialEntries: ['/shop'] })

    expect(trackViewItemList).toHaveBeenCalledWith('Shop All', [
      { id: 'gid://shopify/Product/aria-pendant', name: 'Product 1', price: '1.00' },
    ])

    productsData = createProducts(['aria-pendant', 'cassia-chain'])
    rerender(<ShopPage />)

    expect(trackViewItemList).toHaveBeenCalledTimes(2)
    expect(trackViewItemList).toHaveBeenLastCalledWith('Shop All', [
      { id: 'gid://shopify/Product/aria-pendant', name: 'Product 1', price: '1.00' },
      { id: 'gid://shopify/Product/cassia-chain', name: 'Product 2', price: '2.00' },
    ])
  })
})