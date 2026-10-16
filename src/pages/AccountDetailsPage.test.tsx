import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AccountDetailsPage } from './AccountDetailsPage'
import { useCustomerSession, useCustomerProfile, useUpdateName, useSetEmailMarketing } from '@/lib/customer'
import { toast } from 'sonner'

vi.mock('@/lib/customer', () => ({
  useCustomerSession: vi.fn(),
  useCustomerProfile: vi.fn(),
  useUpdateName: vi.fn(),
  useSetEmailMarketing: vi.fn(),
  CustomerUserError: class CustomerUserError extends Error {},
}))
const open = vi.fn()
vi.mock('@/context/SignInDialogContext', () => ({ useSignInDialog: () => ({ open }) }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))

const session = vi.mocked(useCustomerSession)
const profile = vi.mocked(useCustomerProfile)
const updateName = vi.fn()
const setMarketing = vi.fn()

const PROFILE = {
  id: 'c',
  firstName: 'Jane',
  lastName: 'Doe',
  displayName: 'Jane Doe',
  emailAddress: { emailAddress: 'jane@example.com', marketingState: 'SUBSCRIBED' },
  phoneNumber: { phoneNumber: '+1 613 555 1111' },
  defaultAddress: null,
}

function renderPage() {
  return render(
    <MemoryRouter>
      <AccountDetailsPage />
    </MemoryRouter>,
  )
}

describe('AccountDetailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    session.mockReturnValue({ session: { status: 'signed-in', customer: { id: 'c', name: 'J', email: 'j@x.com' } } } as never)
    profile.mockReturnValue({ data: PROFILE, isLoading: false } as never)
    updateName.mockResolvedValue(undefined)
    setMarketing.mockResolvedValue(undefined)
    vi.mocked(useUpdateName).mockReturnValue({ mutateAsync: updateName, isPending: false } as never)
    vi.mocked(useSetEmailMarketing).mockReturnValue({ mutateAsync: setMarketing, isPending: false } as never)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('opens the sign-in dialog when signed out', () => {
    session.mockReturnValue({ session: { status: 'signed-out' } } as never)
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(open).toHaveBeenCalled()
  })

  it('shows loading while the session loads', () => {
    session.mockReturnValue({ session: { status: 'loading' } } as never)
    renderPage()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows name fields, read-only email and phone, and no password field', () => {
    renderPage()
    expect(screen.getByLabelText(/first name/i)).toHaveValue('Jane')
    expect(screen.getByLabelText(/last name/i)).toHaveValue('Doe')
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    expect(screen.getByText('+1 613 555 1111')).toBeInTheDocument()
    expect(screen.queryByText(/password/i)).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('saves the edited name', async () => {
    renderPage()
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Janet' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(updateName).toHaveBeenCalledWith({ firstName: 'Janet', lastName: 'Doe' }))
    expect(toast.success).toHaveBeenCalled()
  })

  it('toggles email marketing', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('checkbox'))
    await waitFor(() => expect(setMarketing).toHaveBeenCalledWith(false))
  })

  it('shows the error message when saving the name fails', async () => {
    updateName.mockRejectedValue(new Error('Name is invalid'))
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Name is invalid'))
  })

  it('links to the hosted profile page when VITE_SHOPIFY_ACCOUNT_URL is set', () => {
    vi.stubEnv('VITE_SHOPIFY_ACCOUNT_URL', 'https://shopify.com/123')
    renderPage()
    expect(screen.getByRole('link', { name: /change email or phone/i })).toHaveAttribute(
      'href',
      'https://shopify.com/123/profile',
    )
  })

  it('hides the profile link when the variable is unset', () => {
    vi.stubEnv('VITE_SHOPIFY_ACCOUNT_URL', '')
    renderPage()
    expect(screen.queryByRole('link', { name: /change email or phone/i })).not.toBeInTheDocument()
  })
})
