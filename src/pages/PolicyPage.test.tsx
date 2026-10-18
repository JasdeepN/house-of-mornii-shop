import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'

const shopifyFetch = vi.fn()
vi.mock('@/lib/shopify/client', async (orig) => ({
  ...(await orig<object>()),
  shopifyFetch: (...args: unknown[]) => shopifyFetch(...args),
}))

const { PolicyPage } = await import('./PolicyPage')
const { NotFoundPage } = await import('./NotFoundPage')

beforeEach(() => shopifyFetch.mockReset())

describe('PolicyPage', () => {
  it('renders the policy with its title and sanitised body', async () => {
    shopifyFetch.mockResolvedValue({
      shop: { privacyPolicy: { title: 'Privacy policy', body: '<p>We keep little.</p><script>alert(1)</script><img src=x onerror=alert(1)>', handle: 'privacy-policy', url: 'u' } },
    })
    renderWithProviders(<PolicyPage kind="privacy" />, { initialEntries: ['/policies/privacy'] })

    expect(await screen.findByText('We keep little.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Privacy policy' })).toBeInTheDocument()
    const body = screen.getByTestId('policy-body')
    expect(body.querySelector('script')).toBeNull()
    expect(body.querySelector('img')).toBeNull()
  })

  it('says the policy is unpublished and links to Contact when the body is empty', async () => {
    shopifyFetch.mockResolvedValue({ shop: { refundPolicy: { title: 'Refund policy', body: '', handle: 'r', url: 'u' } } })
    renderWithProviders(<PolicyPage kind="refund" />, { initialEntries: ['/policies/refund'] })

    expect(await screen.findByText("This policy hasn't been published yet.")).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Refund policy' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /contact/i })).toHaveAttribute('href', '/contact')
  })
})

describe('NotFoundPage', () => {
  it('has a heading and links to Shop and Home', () => {
    renderWithProviders(<NotFoundPage />, { initialEntries: ['/nope'] })
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'SHOP' })).toHaveAttribute('href', '/shop')
    expect(screen.getByRole('link', { name: 'HOME' })).toHaveAttribute('href', '/')
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', expect.stringContaining('noindex'))
  })
})
