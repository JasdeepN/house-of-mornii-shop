import { describe, it, expect, vi, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import { Footer } from './Footer'

afterEach(() => vi.unstubAllEnvs())

describe('Footer', () => {
  it('links the four policy pages', () => {
    renderWithProviders(<Footer />)
    const nav = screen.getByRole('navigation', { name: 'Policies' })
    const hrefs = Array.from(nav.querySelectorAll('a')).map((a) => a.getAttribute('href'))
    expect(hrefs).toEqual(['/policies/refund', '/policies/shipping', '/policies/privacy', '/policies/terms'])
  })

  it('hides the newsletter form unless VITE_NEWSLETTER_ENABLED is true', () => {
    const { unmount } = renderWithProviders(<Footer />)
    expect(screen.queryByPlaceholderText(/your@email\.com/i)).not.toBeInTheDocument()
    unmount()
    vi.stubEnv('VITE_NEWSLETTER_ENABLED', 'true')
    renderWithProviders(<Footer />)
    expect(screen.getByPlaceholderText(/your@email\.com/i)).toBeInTheDocument()
  })
})
