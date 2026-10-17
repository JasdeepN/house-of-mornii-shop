import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithRouter } from '@/test/utils'
import { ProductCard } from './ProductCard'
import { fixtureProductWithPrices } from '@/test/fixtures/catalog-fixtures'

describe('ProductCard', () => {
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
})
