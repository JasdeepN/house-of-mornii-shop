import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import { useSEO } from './useSEO'

const shopifyFetch = vi.fn()
vi.mock('@/lib/shopify/client', () => ({
  IS_CONFIGURED: true,
  shopifyFetch: (...args: unknown[]) => shopifyFetch(...args),
}))

function Probe({ image }: { image?: string }) {
  useSEO({ title: 'Test', image })
  return null
}
const og = () => document.querySelector('meta[property="og:image"]')?.getAttribute('content')

beforeEach(() => shopifyFetch.mockReset())

describe('useSEO default image', () => {
  it('prefers the Brand cover image', async () => {
    shopifyFetch.mockResolvedValue({ shop: { brand: { coverImage: { image: { url: 'https://cdn.example/cover.png' } } } } })
    renderWithProviders(<Probe />)
    await waitFor(() => expect(og()).toBe('https://cdn.example/cover.png'))
  })

  it('falls back to the static og-image when there is no cover image', async () => {
    shopifyFetch.mockResolvedValue({ shop: { brand: null } })
    renderWithProviders(<Probe />)
    await waitFor(() => expect(og()).toMatch(/\/og-image\.png$/))
  })

  it('keeps an explicit image', async () => {
    shopifyFetch.mockResolvedValue({ shop: { brand: { coverImage: { image: { url: 'https://cdn.example/cover.png' } } } } })
    renderWithProviders(<Probe image="https://cdn.example/product.png" />)
    await waitFor(() => expect(og()).toBe('https://cdn.example/product.png'))
  })
})
