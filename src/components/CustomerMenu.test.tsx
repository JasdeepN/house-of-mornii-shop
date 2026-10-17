import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, userEvent } from '@/test/utils'
import { CustomerMenu } from './CustomerMenu'

const signOut = vi.fn()
const open = vi.fn()
vi.mock('@/context/SignInDialogContext', async (orig) => ({
  ...(await orig<typeof import('@/context/SignInDialogContext')>()),
  useSignInDialog: () => ({ open }),
}))
vi.mock('@/lib/customer', async (orig) => {
  const actual = await orig<typeof import('@/lib/customer')>()
  return {
    ...actual,
    useCustomerSession: () => {
      const real = actual.useCustomerSession()
      return { ...real, signOut }
    },
  }
})

describe('CustomerMenu', () => {
  it('shows nothing while loading', () => {
    renderWithProviders(<CustomerMenu />, { session: 'loading' })
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('signed out: Sign in opens the dialog', async () => {
    renderWithProviders(<CustomerMenu />, { session: 'signed-out' })
    await userEvent.click(await screen.findByRole('button', { name: /sign in/i }))
    expect(open).toHaveBeenCalled()
  })

  it('signed in: shows name, links, and Sign out', async () => {
    renderWithProviders(<CustomerMenu />, {
      session: { id: 'gid://shopify/Customer/1', name: 'Ada Lovelace', email: 'ada@x.co' },
    })
    await userEvent.click(await screen.findByRole('button', { name: /ada lovelace/i }))
    expect(screen.getByRole('link', { name: /orders/i })).toHaveAttribute('href', '/account/orders')
    await userEvent.click(screen.getByRole('button', { name: /sign out/i }))
    expect(signOut).toHaveBeenCalled()
  })

  it('falls back to email when name is empty', async () => {
    renderWithProviders(<CustomerMenu />, {
      session: { id: 'gid://shopify/Customer/1', name: '', email: 'ada@x.co' },
    })
    await waitFor(() => expect(screen.getByRole('button', { name: /ada@x.co/i })).toBeInTheDocument())
  })
})
