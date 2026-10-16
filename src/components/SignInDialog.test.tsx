import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const signIn = vi.fn()
vi.mock('@/lib/customer', () => ({
  useCustomerSession: () => ({ session: { status: 'signed-out' }, signIn, signOut: vi.fn() }),
}))

import { SignInDialog } from './SignInDialog'

describe('SignInDialog', () => {
  beforeEach(() => signIn.mockClear())

  it('has a labelled email field and no password or legacy links', () => {
    render(<SignInDialog open onOpenChange={() => {}} />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/create account|forgot/i)).not.toBeInTheDocument()
    expect(screen.getByText(/one-time code/i)).toBeInTheDocument()
  })

  it('calls signIn with the trimmed email', async () => {
    render(<SignInDialog open onOpenChange={() => {}} />)
    await userEvent.type(screen.getByLabelText(/email/i), '  a@b.co  ')
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(signIn).toHaveBeenCalledWith('a@b.co')
  })

  it('refuses an empty or invalid email', async () => {
    render(<SignInDialog open onOpenChange={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    await userEvent.type(screen.getByLabelText(/email/i), 'nope')
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(signIn).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
