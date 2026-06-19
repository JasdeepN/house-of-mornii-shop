import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, userEvent } from '@/test/utils'
import { SearchBar } from './SearchBar'

const mockUseProducts = vi.fn()
const mockNavigate = vi.fn()

vi.mock('@/lib/shopify', () => ({
  useProducts: (...args: unknown[]) => mockUseProducts(...args),
  formatMoney: () => '$100.00',
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

class ResizeObserverMock {
  disconnect() {}
  observe() {}
  unobserve() {}
}

function createProductsPage(
  products: Array<{ handle: string; id?: string; title: string }>,
  pageInfo?: { endCursor: string | null; hasNextPage: boolean },
) {
  return {
    data: {
      edges: products.map((product, index) => ({
        node: {
          id: product.id ?? `product-${product.handle}-${index}`,
          handle: product.handle,
          title: product.title,
          tags: ['ring'],
          featuredImage: null,
          priceRange: { minVariantPrice: { amount: '100.00', currencyCode: 'USD' } },
        },
      })),
      pageInfo: pageInfo ?? { endCursor: null, hasNextPage: false },
    },
    isFetching: false,
    isLoading: false,
  }
}

describe('SearchBar', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
    mockNavigate.mockReset()
    mockUseProducts.mockReset()
    mockUseProducts.mockReturnValue({ data: undefined, isFetching: false, isLoading: false })
  })

  it('loads additional result pages for a search query', async () => {
    mockUseProducts.mockImplementation((_sortKey, _reverse, query, first, after) => {
      if (query === 'Alpha' && first === 24 && after === 'cursor-1') {
        return createProductsPage(
          [{ handle: 'amber-charm', title: 'Amber Charm' }],
          { endCursor: null, hasNextPage: false },
        )
      }

      if (query === 'Alpha' && first === 24) {
        return createProductsPage(
          [{ handle: 'alpha-ring', title: 'Alpha Ring' }],
          { endCursor: 'cursor-1', hasNextPage: true },
        )
      }

      return createProductsPage([])
    })

    const user = userEvent.setup()
    renderWithProviders(<SearchBar />)

    await user.click(screen.getByRole('button', { name: /search products/i }))
    await user.type(screen.getByLabelText('Search products'), 'Alpha<>')

    await waitFor(() => {
      expect(mockUseProducts).toHaveBeenCalledWith('BEST_SELLING', false, 'Alpha', 24, undefined)
    })

    expect(await screen.findByText('Alpha Ring')).toBeInTheDocument()

    await user.click(await screen.findByRole('button', { name: 'LOAD MORE RESULTS' }))

    await waitFor(() => {
      expect(mockUseProducts).toHaveBeenCalledWith('BEST_SELLING', false, 'Alpha', 24, 'cursor-1')
    })

    expect(await screen.findByText('Amber Charm')).toBeInTheDocument()
  })

  it('resets accumulated results when the query changes', async () => {
    mockUseProducts.mockImplementation((_sortKey, _reverse, query, first, after) => {
      if (query === 'Alpha' && first === 24 && after === 'cursor-1') {
        return createProductsPage(
          [{ handle: 'amber-charm', title: 'Amber Charm' }],
          { endCursor: null, hasNextPage: false },
        )
      }

      if (query === 'Alpha' && first === 24) {
        return createProductsPage(
          [{ handle: 'alpha-ring', title: 'Alpha Ring' }],
          { endCursor: 'cursor-1', hasNextPage: true },
        )
      }

      if (query === 'Beta' && first === 24) {
        return createProductsPage([{ handle: 'beta-chain', title: 'Beta Chain' }])
      }

      return createProductsPage([])
    })

    const user = userEvent.setup()
    renderWithProviders(<SearchBar />)

    await user.click(screen.getByRole('button', { name: /search products/i }))
    const input = screen.getByLabelText('Search products')
    await user.type(input, 'Alpha')
    expect(await screen.findByText('Alpha Ring')).toBeInTheDocument()

    await user.click(await screen.findByRole('button', { name: 'LOAD MORE RESULTS' }))
    expect(await screen.findByText('Amber Charm')).toBeInTheDocument()

    await user.clear(input)
    await user.type(input, 'Beta')

    await waitFor(() => {
      expect(screen.getByText('Beta Chain')).toBeInTheDocument()
      expect(screen.queryByText('Alpha Ring')).not.toBeInTheDocument()
      expect(screen.queryByText('Amber Charm')).not.toBeInTheDocument()
    })
  })

  it('clears query state on selection and close', async () => {
    const onClose = vi.fn()
    mockUseProducts.mockImplementation((_sortKey, _reverse, query, first) => {
      if (query === 'Alpha' && first === 24) {
        return createProductsPage([{ handle: 'alpha-ring', title: 'Alpha Ring' }])
      }

      return createProductsPage([])
    })

    const user = userEvent.setup()
    renderWithProviders(<SearchBar onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: /search products/i }))
    const input = screen.getByLabelText('Search products')
    await user.type(input, 'Alpha<>')
    await user.click(await screen.findByText('Alpha Ring'))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/products/alpha-ring')
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    await user.click(screen.getByRole('button', { name: /search products/i }))
    expect(screen.getByLabelText('Search products')).toHaveValue('')

    await user.type(screen.getByLabelText('Search products'), 'Alpha<>')
    await user.click(screen.getByRole('button', { name: 'Close search' }))
    await user.click(screen.getByRole('button', { name: /search products/i }))

    expect(screen.getByLabelText('Search products')).toHaveValue('')
    expect(screen.queryByText('Alpha Ring')).not.toBeInTheDocument()
  })
})