import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithRouter, userEvent } from '@/test/utils'
import { QuickAddDialog } from './QuickAddDialog'
import { fixtureProductSummaries } from '@/test/fixtures/catalog-fixtures'
import { getFixtureProduct } from '@/test/fixtures/shopify-fixtures'

const shopifyFetch = vi.fn()
const addToCart = vi.fn()
const openCart = vi.fn()

vi.mock('@/lib/shopify/client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/shopify/client')>('@/lib/shopify/client')
  return {
    ...actual,
    IS_CONFIGURED: true,
    STOREFRONT_MODE: 'token',
    shopifyFetch: (...args: unknown[]) => shopifyFetch(...args),
  }
})

vi.mock('@/context/CartContext', () => ({
  useCart: () => ({ addToCart, openCart }),
}))

const summary = fixtureProductSummaries()[0]

function twoVariants() {
  const raw = getFixtureProduct(summary.handle)!
  const node = raw.variants.edges[0].node
  return {
    ...raw,
    variants: {
      edges: [
        { node: { ...node, id: 'v-small', title: 'Small', availableForSale: true } },
        { node: { ...node, id: 'v-large', title: 'Large', availableForSale: false } },
      ],
    },
  }
}

describe('QuickAddDialog', () => {
  beforeEach(() => {
    shopifyFetch.mockReset().mockResolvedValue({ product: twoVariants() })
    addToCart.mockReset().mockResolvedValue(undefined)
    openCart.mockReset()
  })

  it('lists the Variants and disables a sold-out one', async () => {
    renderWithRouter(<QuickAddDialog product={summary} open onOpenChange={() => {}} />)

    expect(await screen.findByRole('button', { name: /Small/ })).toBeEnabled()
    const large = screen.getByRole('button', { name: /Large/ })
    expect(large).toBeDisabled()
    expect(large).toHaveTextContent('Sold out')
    expect(screen.getByText('Choose an option')).toBeInTheDocument()
  })

  it('adds the chosen Variant, opens the Cart and closes', async () => {
    const onOpenChange = vi.fn()
    renderWithRouter(<QuickAddDialog product={summary} open onOpenChange={onOpenChange} />)

    await userEvent.click(await screen.findByRole('button', { name: /Small/ }))

    expect(addToCart).toHaveBeenCalledWith('v-small')
    await vi.waitFor(() => expect(openCart).toHaveBeenCalled())
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows an error when the Product fails to load', async () => {
    shopifyFetch.mockReset().mockRejectedValue(new Error('boom'))
    renderWithRouter(<QuickAddDialog product={summary} open onOpenChange={() => {}} />)

    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it('does not fetch while closed', () => {
    renderWithRouter(<QuickAddDialog product={summary} open={false} onOpenChange={() => {}} />)
    expect(shopifyFetch).not.toHaveBeenCalled()
  })
})
