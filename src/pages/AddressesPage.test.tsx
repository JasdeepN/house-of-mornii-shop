import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AddressesPage } from './AddressesPage'
import {
  useCustomerSession,
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  CustomerUserError,
} from '@/lib/customer'
import { toast } from 'sonner'

vi.mock('@/lib/customer', () => {
  class CustomerUserError extends Error {
    constructor(errors: { message: string }[]) {
      super(errors[0]?.message)
    }
  }
  return {
    useCustomerSession: vi.fn(),
    useAddresses: vi.fn(),
    useCreateAddress: vi.fn(),
    useUpdateAddress: vi.fn(),
    useDeleteAddress: vi.fn(),
    CustomerUserError,
  }
})
const open = vi.fn()
vi.mock('@/context/SignInDialogContext', () => ({ useSignInDialog: () => ({ open }) }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))

const create = vi.fn()
const update = vi.fn()
const remove = vi.fn()

const addr = (n: number, city: string) => ({
  id: `gid://shopify/CustomerAddress/${n}`,
  firstName: 'Jane',
  lastName: 'Doe',
  company: null,
  address1: `${n} Main St`,
  address2: null,
  city,
  zoneCode: 'ON',
  zip: 'K1A 0A1',
  countryCode: 'CA',
  phoneNumber: null,
  formatted: [],
})
const A1 = addr(1, 'Ottawa')
const A2 = addr(2, 'Toronto')

function renderPage() {
  return render(
    <MemoryRouter>
      <AddressesPage />
    </MemoryRouter>,
  )
}

describe('AddressesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useCustomerSession).mockReturnValue({
      session: { status: 'signed-in', customer: { id: 'c', name: 'J', email: 'j@x.com' } },
    } as never)
    vi.mocked(useAddresses).mockReturnValue({
      data: { addresses: [A1, A2], defaultAddressId: A1.id },
    } as never)
    create.mockResolvedValue(undefined)
    update.mockResolvedValue(undefined)
    remove.mockResolvedValue(undefined)
    vi.mocked(useCreateAddress).mockReturnValue({ mutateAsync: create, isPending: false } as never)
    vi.mocked(useUpdateAddress).mockReturnValue({ mutateAsync: update, isPending: false } as never)
    vi.mocked(useDeleteAddress).mockReturnValue({ mutateAsync: remove, isPending: false } as never)
  })

  it('opens the sign-in dialog when signed out', () => {
    vi.mocked(useCustomerSession).mockReturnValue({ session: { status: 'signed-out' } } as never)
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(open).toHaveBeenCalled()
  })

  it('shows loading while the session loads', () => {
    vi.mocked(useCustomerSession).mockReturnValue({ session: { status: 'loading' } } as never)
    renderPage()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('lists addresses and marks only the default', () => {
    renderPage()
    expect(screen.getByText('1 Main St')).toBeInTheDocument()
    expect(screen.getByText('2 Main St')).toBeInTheDocument()
    expect(screen.getAllByText('DEFAULT')).toHaveLength(1)
  })

  it('orders countries with Canada and United States first', () => {
    renderPage()
    fireEvent.click(screen.getAllByRole('button', { name: /add address/i })[0])
    const select = screen.getByLabelText('Country') as HTMLSelectElement
    const codes = Array.from(select.options).map((o) => o.value)
    expect(codes.slice(0, 3)).toEqual(['', 'CA', 'US'])
    expect(within(select).getByRole('option', { name: 'Canada' })).toBeInTheDocument()
    expect(codes).toContain('AF')
  })

  it('adds an address with countryCode and the default flag', async () => {
    renderPage()
    fireEvent.click(screen.getAllByRole('button', { name: /add address/i })[0])
    fireEvent.change(screen.getByPlaceholderText('Address line 1'), { target: { value: '9 New Rd' } })
    fireEvent.change(screen.getByPlaceholderText('City'), { target: { value: 'Halifax' } })
    fireEvent.change(screen.getByPlaceholderText('Province/State'), { target: { value: 'NS' } })
    fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'CA' } })
    fireEvent.click(screen.getByRole('checkbox', { name: /default/i }))
    fireEvent.click(screen.getByRole('button', { name: /save address/i }))
    await waitFor(() => expect(create).toHaveBeenCalled())
    const vars = create.mock.calls[0][0]
    expect(vars.defaultAddress).toBe(true)
    expect(vars.address).toMatchObject({ address1: '9 New Rd', city: 'Halifax', zoneCode: 'NS', countryCode: 'CA' })
    expect(toast.success).toHaveBeenCalledWith('Address added')
  })

  it('edits an address, preselecting its default flag', async () => {
    renderPage()
    fireEvent.click(screen.getAllByRole('button', { name: /edit/i })[1])
    fireEvent.change(screen.getByPlaceholderText('City'), { target: { value: 'Kingston' } })
    fireEvent.click(screen.getByRole('checkbox', { name: /default/i }))
    fireEvent.click(screen.getByRole('button', { name: /save address/i }))
    await waitFor(() => expect(update).toHaveBeenCalled())
    const vars = update.mock.calls[0][0]
    expect(vars.id).toBe(A2.id)
    expect(vars.defaultAddress).toBe(true)
    expect(vars.address).toMatchObject({ city: 'Kingston', countryCode: 'CA' })
    expect(toast.success).toHaveBeenCalledWith('Address updated')
  })

  it('removes an address', async () => {
    renderPage()
    fireEvent.click(screen.getAllByRole('button', { name: /delete/i })[0])
    await waitFor(() => expect(remove).toHaveBeenCalledWith(A1.id))
    expect(toast.success).toHaveBeenCalledWith('Address removed')
  })

  it("shows Shopify's message when an address is rejected", async () => {
    create.mockRejectedValue(new CustomerUserError([{ field: null, message: 'Zip is invalid' }] as never))
    renderPage()
    fireEvent.click(screen.getAllByRole('button', { name: /add address/i })[0])
    fireEvent.change(screen.getByPlaceholderText('Address line 1'), { target: { value: '9 New Rd' } })
    fireEvent.change(screen.getByPlaceholderText('City'), { target: { value: 'Halifax' } })
    fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'CA' } })
    fireEvent.click(screen.getByRole('button', { name: /save address/i }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Zip is invalid'))
  })
})
