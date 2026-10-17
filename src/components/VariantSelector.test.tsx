import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VariantSelector } from './VariantSelector'
import { fixtureProduct } from '@/test/fixtures/catalog-fixtures'
import type { Product, Variant } from '@/lib/shopify'

const money = { amount: '50.00', currencyCode: 'CAD' }

function variant(size: string, colour: string, availableForSale = true): Variant {
  return {
    id: `${size}-${colour}`,
    title: `${size} / ${colour}`,
    availableForSale,
    price: money,
    compareAtPrice: null,
    selectedOptions: [
      { name: 'Size', value: size },
      { name: 'Colour', value: colour },
    ],
    image: null,
  }
}

function twoOptionProduct(variants: Variant[]): Product {
  return {
    ...fixtureProduct('aria-pendant'),
    options: [
      { name: 'Size', values: ['S', 'M'] },
      { name: 'Colour', values: ['Gold', 'Silver'] },
    ],
    variants,
  }
}

describe('VariantSelector', () => {
  it('keeps the other choices when one option changes (S/Gold + Silver gives S/Silver)', async () => {
    const variants = [variant('S', 'Gold'), variant('M', 'Silver'), variant('S', 'Silver'), variant('M', 'Gold')]
    const onVariantChange = vi.fn()
    render(
      <VariantSelector product={twoOptionProduct(variants)} selectedVariant={variants[0]} onVariantChange={onVariantChange} />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Silver' }))

    expect(onVariantChange).toHaveBeenCalledWith(variants[2])
  })

  it('renders a value as unavailable when its combined Variant is sold out', () => {
    const variants = [variant('S', 'Gold'), variant('S', 'Silver', false), variant('M', 'Gold'), variant('M', 'Silver')]
    render(
      <VariantSelector product={twoOptionProduct(variants)} selectedVariant={variants[0]} onVariantChange={vi.fn()} />,
    )

    expect(screen.getByRole('button', { name: 'Silver' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Gold' })).toBeEnabled()
  })
})
