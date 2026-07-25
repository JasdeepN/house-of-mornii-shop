import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AddressesPage } from './AddressesPage'
import { useCustomerAuth } from '@/context/CustomerAuthContext'
import { toast } from 'sonner'
import type { ShopifyCustomer, ShopifyMailingAddress } from '@/lib/shopify/types'

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

const ADDRESS_1: ShopifyMailingAddress = {
  id: 'gid://shopify/MailingAddress/1',
  firstName: 'Jane',
  lastName: 'Doe',
  address1: '123 Main St',
  address2: null,
  company: null,
  city: 'Ottawa',
  province: 'ON',
  country: 'Canada',
  zip: 'K1A 0A1',
  phone: '',
}

const ADDRESS_2: ShopifyMailingAddress = {
  id: 'gid://shopify/MailingAddress/2',
  firstName: 'Jane',
  lastName: 'Doe',
  address1: '456 Second Ave',
  address2: null,
  company: null,
  city: 'Toronto',
  province: 'ON',
  country: 'Canada',
  zip: 'M5V 2T6',
  phone: '',
}

function customerWithAddresses(
  addresses: ShopifyMailingAddress[],
  defaultAddressId: string | null = null,
): ShopifyCustomer {
  return {
    id: 'gid://shopify/Customer/1',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    phone: null,
    acceptsMarketing: false,
    defaultAddress: defaultAddressId ? { id: defaultAddressId } : null,
    addresses: { edges: addresses.map((node) => ({ node })) },
    orders: { edges: [], pageInfo: { hasNextPage: false, endCursor: null } },
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <AddressesPage />
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

describe('AddressesPage', () => {
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

  it('renders the auth-guard when logged out', () => {
    mockedUseCustomerAuth.mockReturnValue(
      buildAuthValue({ isAuthenticated: false, customer: null }),
    )
    renderPage()
    expect(screen.getByText('ACCOUNT REQUIRED')).toBeInTheDocument()
    expect(screen.getByText('Please sign in to manage your addresses.')).toBeInTheDocument()
  })

  it('renders the empty-state when there are zero addresses', () => {
    mockedUseCustomerAuth.mockReturnValue(
      buildAuthValue({
        isAuthenticated: true,
        customer: customerWithAddresses([]),
      }),
    )
    renderPage()
    expect(screen.getByText("You haven't added any addresses yet.")).toBeInTheDocument()
  })

  it('renders the address list from context, marking the default address', () => {
    mockedUseCustomerAuth.mockReturnValue(
      buildAuthValue({
        isAuthenticated: true,
        customer: customerWithAddresses([ADDRESS_1, ADDRESS_2], ADDRESS_1.id),
      }),
    )
    renderPage()

    expect(screen.getByText('123 Main St')).toBeInTheDocument()
    expect(screen.getByText('456 Second Ave')).toBeInTheDocument()
    expect(screen.getByText('DEFAULT')).toBeInTheDocument()
    // SET DEFAULT button should only appear for the non-default address
    expect(screen.getAllByRole('button', { name: /set default/i })).toHaveLength(1)
  })

  it('opens the add-address form and calls createAddress on submit', async () => {
    const createAddress = vi.fn().mockResolvedValue(undefined)
    mockedUseCustomerAuth.mockReturnValue(
      buildAuthValue({
        isAuthenticated: true,
        customer: customerWithAddresses([]),
        createAddress,
      }),
    )
    renderPage()

    const addButtons = screen.getAllByRole('button', { name: /add address/i })
    fireEvent.click(addButtons[0])
    expect(screen.getByText('NEW ADDRESS')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Address line 1'), {
      target: { value: '789 Third St' },
    })
    fireEvent.change(screen.getByPlaceholderText('City'), { target: { value: 'Ottawa' } })
    fireEvent.change(screen.getByPlaceholderText('Country'), { target: { value: 'Canada' } })
    fireEvent.click(screen.getByRole('button', { name: /save address/i }))

    await waitFor(() =>
      expect(createAddress).toHaveBeenCalledWith(
        expect.objectContaining({
          address1: '789 Third St',
          city: 'Ottawa',
          country: 'Canada',
        }),
      ),
    )
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Address added'))
  })

  it('opens the edit form pre-filled and calls updateAddress on submit', async () => {
    const updateAddress = vi.fn().mockResolvedValue(undefined)
    mockedUseCustomerAuth.mockReturnValue(
      buildAuthValue({
        isAuthenticated: true,
        customer: customerWithAddresses([ADDRESS_1]),
        updateAddress,
      }),
    )
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: /edit/i }))
    expect(screen.getByText('EDIT ADDRESS')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Address line 1')).toHaveValue('123 Main St')

    fireEvent.change(screen.getByPlaceholderText('City'), { target: { value: 'Gatineau' } })
    fireEvent.click(screen.getByRole('button', { name: /save address/i }))

    await waitFor(() =>
      expect(updateAddress).toHaveBeenCalledWith(
        ADDRESS_1.id,
        expect.objectContaining({ city: 'Gatineau' }),
      ),
    )
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Address updated'))
  })

  it('calls deleteAddress when the delete button is clicked', async () => {
    const deleteAddress = vi.fn().mockResolvedValue(undefined)
    mockedUseCustomerAuth.mockReturnValue(
      buildAuthValue({
        isAuthenticated: true,
        customer: customerWithAddresses([ADDRESS_1]),
        deleteAddress,
      }),
    )
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() => expect(deleteAddress).toHaveBeenCalledWith(ADDRESS_1.id))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Address removed'))
  })

  it('calls setDefaultAddress when SET DEFAULT is clicked', async () => {
    const setDefaultAddress = vi.fn().mockResolvedValue(undefined)
    mockedUseCustomerAuth.mockReturnValue(
      buildAuthValue({
        isAuthenticated: true,
        customer: customerWithAddresses([ADDRESS_1, ADDRESS_2], ADDRESS_1.id),
        setDefaultAddress,
      }),
    )
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: /set default/i }))

    await waitFor(() => expect(setDefaultAddress).toHaveBeenCalledWith(ADDRESS_2.id))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Default address updated'))
  })

  it('shows an error toast when deleteAddress rejects', async () => {
    const deleteAddress = vi.fn().mockRejectedValue(new Error('Failed to delete address. Please try again.'))
    mockedUseCustomerAuth.mockReturnValue(
      buildAuthValue({
        isAuthenticated: true,
        customer: customerWithAddresses([ADDRESS_1]),
        deleteAddress,
      }),
    )
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Failed to delete address. Please try again.'),
    )
  })
})
