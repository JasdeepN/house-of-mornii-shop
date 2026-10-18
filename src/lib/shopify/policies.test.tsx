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

const { usePolicy, toPolicy } = await import('./policies')

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeEach(() => shopifyFetch.mockReset())

describe('toPolicy', () => {
  it('is null for missing, empty and markup-only bodies', () => {
    expect(toPolicy(null)).toBeNull()
    expect(toPolicy({ title: 'Refund policy', body: '' })).toBeNull()
    expect(toPolicy({ title: 'Refund policy', body: '<p>&nbsp;</p>' })).toBeNull()
  })
})

describe('usePolicy', () => {
  it('returns the requested policy', async () => {
    shopifyFetch.mockResolvedValue({
      shop: {
        refundPolicy: { title: 'Refund policy', body: '', handle: 'refund-policy', url: 'u1' },
        privacyPolicy: { title: 'Privacy policy', body: '<p>We keep little.</p>', handle: 'privacy-policy', url: 'u2' },
      },
    })
    const { result } = renderHook(() => usePolicy('privacy'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ title: 'Privacy policy', body: '<p>We keep little.</p>', handle: 'privacy-policy', url: 'u2' })
  })

  it('returns null for an unwritten policy', async () => {
    shopifyFetch.mockResolvedValue({ shop: { refundPolicy: { title: 'Refund policy', body: '', handle: 'r', url: 'u' }, termsOfService: null } })
    const { result } = renderHook(() => usePolicy('refund'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })
})
