import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AccountPage } from './AccountPage'
import { useCustomerSession, useCustomerProfile, useOrders } from '@/lib/customer'

vi.mock('@/lib/customer', () => ({
  useCustomerSession: vi.fn(),
  useCustomerProfile: vi.fn(),
  useOrders: vi.fn(),
}))
const open = vi.fn()
vi.mock('@/context/SignInDialogContext', () => ({ useSignInDialog: () => ({ open }) }))

const session = vi.mocked(useCustomerSession)
const profile = vi.mocked(useCustomerProfile)
const orders = vi.mocked(useOrders)

const money = { amount: '10.00', currencyCode: 'CAD' }
const order = (n: number) => ({
  id: `gid://shopify/Order/${n}`,
  name: `#${n}`,
  number: n,
  processedAt: '2026-01-02T00:00:00Z',
  financialStatus: 'PAID',
  fulfillmentStatus: 'UNFULFILLED',
  totalPrice: money,
})

function renderPage() {
  return render(
    <MemoryRouter>
      <AccountPage />
    </MemoryRouter>,
  )
}

describe('AccountPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    profile.mockReturnValue({ data: { firstName: 'Jane' } } as never)
    orders.mockReturnValue({
      data: { pages: [{ orders: [order(1004), order(1003), order(1002), order(1001)], pageInfo: {} }] },
    } as never)
  })

  it('shows loading while the session loads', () => {
    session.mockReturnValue({ session: { status: 'loading' } } as never)
    renderPage()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('opens the sign-in dialog when signed out', () => {
    session.mockReturnValue({ session: { status: 'signed-out' } } as never)
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(open).toHaveBeenCalledTimes(1)
  })

  it('greets the Customer and links the three most recent Orders by id tail', () => {
    session.mockReturnValue({
      session: { status: 'signed-in', customer: { id: 'c', name: 'Jane Doe', email: 'j@x.com' } },
    } as never)
    renderPage()
    expect(screen.getByText('HELLO, JANE')).toBeInTheDocument()
    expect(screen.getByText('#1004').closest('a')).toHaveAttribute('href', '/account/orders/1004')
    expect(screen.queryByText('#1001')).not.toBeInTheDocument()
  })
})
