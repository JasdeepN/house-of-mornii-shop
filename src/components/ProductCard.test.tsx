import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithRouter, userEvent } from '@/test/utils'
import { ProductCard } from './ProductCard'
import { fixtureProductWithPrices, listingOf } from '@/test/fixtures/catalog-fixtures'

const addToCart = vi.fn()
const openCart = vi.fn()

vi.mock('@/context/CartContext', () => ({
  useCart: () => ({ addToCart, openCart }),
}))

vi.mock('./QuickAddDialog', () => ({
  QuickAddDialog: ({ open }: { open: boolean }) => (open ? <div role="dialog">Choose an option</div> : null),
}))

describe('ProductCard', () => {
  beforeEach(() => {
    addToCart.mockReset().mockResolvedValue(undefined)
    openCart.mockReset()
  })

  it('shows "From" the lowest price for a range, with no fake compare-at (#25)', () => {
    const product = fixtureProductWithPrices('aria-pendant', { min: '989.87', max: '9889.00' })
    renderWithRouter(<ProductCard product={product} />)

    expect(screen.getByText(/From .*989\.87/)).toBeInTheDocument()
    expect(screen.queryByText(/9,889\.00/)).not.toBeInTheDocument()
  })

  it('strikes through a real compare-at price', () => {
    const product = fixtureProductWithPrices('aria-pendant', { min: '80.00', compareAt: '100.00' })
    renderWithRouter(<ProductCard product={product} />)

    const struck = screen.getByText(/\$100\.00/)
    expect(struck).toHaveClass('line-through')
    expect(screen.getByText(/\$80\.00/)).toBeInTheDocument()
  })

  it('shows a plain price for a single price', () => {
    const product = fixtureProductWithPrices('aria-pendant', { min: '89.00' })
    renderWithRouter(<ProductCard product={product} />)

    expect(screen.getByText(/\$89\.00/)).toBeInTheDocument()
    expect(screen.queryByText(/From/)).not.toBeInTheDocument()
    expect(document.querySelector('.line-through')).toBeNull()
  })

  it('shows the percentage off as a badge on a sale', () => {
    const product = fixtureProductWithPrices('aria-pendant', { min: '80.00', compareAt: '100.00' })
    renderWithRouter(<ProductCard product={product} />)

    expect(screen.getByText(/20%/)).toBeInTheDocument()
  })

  it('links to the Product and remembers the list it came from', () => {
    const [product] = listingOf([{ id: 'a', type: 'Necklace', available: true }])
    renderWithRouter(<ProductCard product={product} />, { initialEntries: ['/shop?type=Necklace'] })

    expect(screen.getByTestId('product-card')).toHaveAttribute('href', '/products/a')
    expect(screen.getByText('Necklace')).toBeInTheDocument()
  })

  it('marks a sold-out Product and disables the + button', () => {
    const [product] = listingOf([{ id: 'a', type: '', available: false }])
    renderWithRouter(<ProductCard product={product} />)

    expect(screen.getByText('Sold out')).toBeInTheDocument()
    expect(screen.getByText('Jewellery')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: `${product.title} is sold out` })).toBeDisabled()
  })

  it('adds the only Variant to the Cart and opens it', async () => {
    const [product] = listingOf([{ id: 'a', type: '', available: true }])
    renderWithRouter(<ProductCard product={product} />)

    await userEvent.click(screen.getByRole('button', { name: `Quick add ${product.title}` }))

    expect(addToCart).toHaveBeenCalledWith('a-v1')
    expect(openCart).toHaveBeenCalled()
  })

  it('opens the picker when the Product has several Variants', async () => {
    const [product] = listingOf([{ id: 'a', type: '', available: true, variants: 2 }])
    renderWithRouter(<ProductCard product={product} />)

    await userEvent.click(screen.getByRole('button', { name: `Quick add ${product.title}` }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(addToCart).not.toHaveBeenCalled()
  })
})
