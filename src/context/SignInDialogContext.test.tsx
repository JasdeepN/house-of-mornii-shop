import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CustomerSessionProvider } from '@/lib/customer'
import { SignInDialogProvider, useSignInDialog } from './SignInDialogContext'

function Opener() {
  const { open } = useSignInDialog()
  return <button onClick={open}>open it</button>
}

describe('SignInDialogProvider', () => {
  it('renders the dialog only after open() is called', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
    render(
      <QueryClientProvider client={new QueryClient()}>
        <CustomerSessionProvider>
          <SignInDialogProvider>
            <Opener />
          </SignInDialogProvider>
        </CustomerSessionProvider>
      </QueryClientProvider>,
    )
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument()
    await userEvent.click(screen.getByText('open it'))
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('throws outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Opener />)).toThrow()
    spy.mockRestore()
  })
})
