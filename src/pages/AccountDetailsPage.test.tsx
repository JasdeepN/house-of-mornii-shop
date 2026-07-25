import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AccountDetailsPage } from './AccountDetailsPage'
import { useCustomerAuth } from '@/context/CustomerAuthContext'
import { toast } from 'sonner'
import type { ShopifyCustomer } from '@/lib/shopify/types'

vi.mock('@/context/CustomerAuthContext', () => ({
  useCustomerAuth: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

const mockedUseCustomerAuth = useCustomerAuth as unknown as ReturnType<typeof vi.fn>

const BASE_CUSTOMER: ShopifyCustomer = {
  id: 'gid://shopify/Customer/1',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  phone: '+1 613 555 1111',
  acceptsMarketing: true,
  defaultAddress: null,
  addresses: { edges: [] },
  orders: { edges: [], pageInfo: { hasNextPage: false, endCursor: null } },
}

function renderPage() {
  return render(
    <MemoryRouter>
      <AccountDetailsPage />
    </MemoryRouter>,
  )
}

function buildAuthValue(overrides: Partial<ReturnType<typeof useCustomerAuth>> = {}) {
  return {
    customer: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: false,
    lastError: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    initiatePasswordRecovery: vi.fn(),
    resetPassword: vi.fn(),
    updateProfile: vi.fn(),
    refreshAccessToken: vi.fn(),
    createAddress: vi.fn(),
    updateAddress: vi.fn(),
    deleteAddress: vi.fn(),
    setDefaultAddress: vi.fn(),
    ...overrides,
  }
}

describe('AccountDetailsPage', () => {
  beforeEach(() => {
    mockedUseCustomerAuth.mockReset()
    vi.mocked(toast.success).mockClear()
    vi.mocked(toast.error).mockClear()
  })

  it('renders a loading state when isLoading is true', () => {
    mockedUseCustomerAuth.mockReturnValue(buildAuthValue({ isLoading: true }))
    renderPage()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders the auth-guard when not authenticated', () => {
    mockedUseCustomerAuth.mockReturnValue(
      buildAuthValue({ isAuthenticated: false, customer: null }),
    )
    renderPage()
    expect(screen.getByText('ACCOUNT REQUIRED')).toBeInTheDocument()
    expect(
      screen.getByText('Please sign in to manage your account details.'),
    ).toBeInTheDocument()
  })

  it('renders the auth-guard when authenticated flag true but customer is null', () => {
    mockedUseCustomerAuth.mockReturnValue(
      buildAuthValue({ isAuthenticated: true, customer: null }),
    )
    renderPage()
    expect(screen.getByText('ACCOUNT REQUIRED')).toBeInTheDocument()
  })

  it('renders the form pre-populated with customer data when authenticated', () => {
    mockedUseCustomerAuth.mockReturnValue(
      buildAuthValue({ isAuthenticated: true, customer: BASE_CUSTOMER }),
    )
    renderPage()

    expect(screen.getByLabelText('First Name')).toHaveValue('Jane')
    expect(screen.getByLabelText('Last Name')).toHaveValue('Doe')
    expect(screen.getByLabelText('Email')).toHaveValue('jane@example.com')
    expect(screen.getByLabelText('Phone')).toHaveValue('+1 613 555 1111')
  })

  it('submits the form and calls updateProfile with correct payload (no password change)', async () => {
    const updateProfile = vi.fn().mockResolvedValue(undefined)
    mockedUseCustomerAuth.mockReturnValue(
      buildAuthValue({ isAuthenticated: true, customer: BASE_CUSTOMER, updateProfile }),
    )
    renderPage()

    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Janet' } })
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() =>
      expect(updateProfile).toHaveBeenCalledWith({
        firstName: 'Janet',
        lastName: 'Doe',
        email: 'jane@example.com',
        phone: '+1 613 555 1111',
        acceptsMarketing: true,
      }),
    )
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Account details updated'))
  })

  it('includes password in payload when a new password is entered', async () => {
    const updateProfile = vi.fn().mockResolvedValue(undefined)
    mockedUseCustomerAuth.mockReturnValue(
      buildAuthValue({ isAuthenticated: true, customer: BASE_CUSTOMER, updateProfile }),
    )
    renderPage()

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/new password/i), 'supersecret1')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() =>
      expect(updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'supersecret1' }),
      ),
    )
  })

  it('shows an error toast when updateProfile rejects', async () => {
    const updateProfile = vi.fn().mockRejectedValue(new Error('Update failed. Please try again.'))
    mockedUseCustomerAuth.mockReturnValue(
      buildAuthValue({ isAuthenticated: true, customer: BASE_CUSTOMER, updateProfile }),
    )
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Update failed. Please try again.'),
    )
    // Submit button should return to its non-submitting label
    expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled()
  })
})
