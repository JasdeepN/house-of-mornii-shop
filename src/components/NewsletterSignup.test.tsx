import { describe, it, expect, vi, afterEach } from 'vitest'
import { screen, waitForElementToBeRemoved } from '@testing-library/react'
import { renderWithProviders, userEvent } from '@/test/utils'
import { NewsletterSignup } from './NewsletterSignup'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('NewsletterSignup', () => {
  it('renders neutral prototype copy without a discount promise', () => {
    renderWithProviders(<NewsletterSignup />)

    expect(screen.getByText(/join the house of mornii list/i)).toBeInTheDocument()
    expect(screen.queryByText(/10%/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/discount/i)).not.toBeInTheDocument()
  })

  it('submits successfully in prototype mode', async () => {
    vi.stubEnv('VITE_NEWSLETTER_ENDPOINT', '')
    const user = userEvent.setup()

    renderWithProviders(<NewsletterSignup />)

    await user.type(screen.getByPlaceholderText(/your@email\.com/i), 'guest@example.com')
    await user.click(screen.getByRole('button', { name: /join/i }))

    await waitForElementToBeRemoved(() => screen.queryByText(/joining/i))
    expect(screen.getByRole('status')).toHaveTextContent(/thank you/i)
  })
})