import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, userEvent } from '@/test/utils'
import { SearchBar } from './SearchBar'

const mockUseProductListing = vi.fn()
const mockNavigate = vi.fn()

vi.mock('@/lib/shopify', async () => {
  const actual = await vi.importActual<typeof import('@/lib/shopify')>('@/lib/shopify')
  return {
    ...actual,
    useProductListing: (...args: unknown[]) => mockUseProductListing(...args),
  }
})

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

const money = (amount: string) => ({ amount, currencyCode: 'USD' })

function createListing(
  items: Array<{ handle: string; id?: string; title: string; range?: boolean }>,
  { hasMore = false, loadMore = vi.fn() }: { hasMore?: boolean; loadMore?: () => void } = {},
) {
  return {
    products: items.map((item, index) => ({
      id: item.id ?? `product-${item.handle}-${index}`,
      handle: item.handle,
      title: item.title,
      featuredImage: null,
      price: {
        min: money('100.00'),
        max: money(item.range ? '250.00' : '100.00'),
        isRange: Boolean(item.range),
        compareAt: null,
        percentOff: 0,
      },
    })),
    collection: null,
    notFound: false,
    isLoading: false,
    error: null,
    hasMore,
    isLoadingMore: false,
    loadMore,
  }
}

const EMPTY = createListing([])

describe('SearchBar', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
    mockNavigate.mockReset()
    mockUseProductListing.mockReset()
    mockUseProductListing.mockReturnValue(EMPTY)
  })

  it('searches the sanitized query and loads more on request', async () => {
    const loadMore = vi.fn()
    mockUseProductListing.mockImplementation(({ query }: { query: string }) =>
      query === 'Alpha'
        ? createListing([{ handle: 'alpha-ring', title: 'Alpha Ring' }], { hasMore: true, loadMore })
        : EMPTY,
    )

    const user = userEvent.setup()
    renderWithProviders(<SearchBar />)

    await user.click(screen.getByRole('button', { name: /search products/i }))
    await user.type(screen.getByLabelText('Search products'), 'Alpha<>')

    await waitFor(() => {
      expect(mockUseProductListing).toHaveBeenCalledWith({ query: 'Alpha', pageSize: 24 })
    })
    expect(await screen.findByText('Alpha Ring')).toBeInTheDocument()

    await user.click(await screen.findByRole('button', { name: 'LOAD MORE RESULTS' }))
    expect(loadMore).toHaveBeenCalledTimes(1)
  })

  it('shows "From" for a Product with a price range', async () => {
    mockUseProductListing.mockImplementation(({ query }: { query: string }) =>
      query === 'Alpha'
        ? createListing([
            { handle: 'alpha-ring', title: 'Alpha Ring', range: true },
            { handle: 'alpha-chain', title: 'Alpha Chain' },
          ])
        : EMPTY,
    )

    const user = userEvent.setup()
    renderWithProviders(<SearchBar />)

    await user.click(screen.getByRole('button', { name: /search products/i }))
    await user.type(screen.getByLabelText('Search products'), 'Alpha')

    expect(await screen.findByText(/^From \$?.*100\.00/)).toBeInTheDocument()
    expect(screen.getByText(/^(?!From).*100\.00/)).toBeInTheDocument()
  })

  it('shows only the new query results after the query changes', async () => {
    mockUseProductListing.mockImplementation(({ query }: { query: string }) => {
      if (query === 'Alpha') return createListing([{ handle: 'alpha-ring', title: 'Alpha Ring' }])
      if (query === 'Beta') return createListing([{ handle: 'beta-chain', title: 'Beta Chain' }])
      return EMPTY
    })

    const user = userEvent.setup()
    renderWithProviders(<SearchBar />)

    await user.click(screen.getByRole('button', { name: /search products/i }))
    const input = screen.getByLabelText('Search products')
    await user.type(input, 'Alpha')
    expect(await screen.findByText('Alpha Ring')).toBeInTheDocument()

    await user.clear(input)
    await user.type(input, 'Beta')

    await waitFor(() => {
      expect(screen.getByText('Beta Chain')).toBeInTheDocument()
      expect(screen.queryByText('Alpha Ring')).not.toBeInTheDocument()
    })
  })

  it('clears query state on selection and close', async () => {
    const onClose = vi.fn()
    mockUseProductListing.mockImplementation(({ query }: { query: string }) =>
      query === 'Alpha' ? createListing([{ handle: 'alpha-ring', title: 'Alpha Ring' }]) : EMPTY,
    )

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