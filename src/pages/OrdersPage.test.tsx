import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { OrdersPage } from './OrdersPage'
import { useCustomerSession, useOrders } from '@/lib/customer'

vi.mock('@/lib/customer', () => ({ useCustomerSession: vi.fn(), useOrders: vi.fn() }))
const open = vi.fn()
vi.mock('@/context/SignInDialogContext', () => ({ useSignInDialog: () => ({ open }) }))

const session = vi.mocked(useCustomerSession)
const orders = vi.mocked(useOrders)
const fetchNextPage = vi.fn()

const order = (n: number) => ({
  id: `gid://shopify/Order/${n}`,
  name: `#${n}`,
  number: n,
  processedAt: '2026-01-02T00:00:00Z',
  financialStatus: 'PAID',
  fulfillmentStatus: 'UNFULFILLED',
  totalPrice: { amount: '10.00', currencyCode: 'CAD' },
})

function renderPage() {
  return render(
    <MemoryRouter>
      <OrdersPage />
    </MemoryRouter>,
  )
}

const signedIn = { session: { status: 'signed-in', customer: { id: 'c', name: 'J', email: 'j@x.com' } } }

describe('OrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('opens the sign-in dialog when signed out', () => {
    session.mockReturnValue({ session: { status: 'signed-out' } } as never)
    orders.mockReturnValue({ data: undefined } as never)
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(open).toHaveBeenCalled()
  })

  it('lists Orders across pages, linking by the numeric id tail', () => {
    session.mockReturnValue(signedIn as never)
    orders.mockReturnValue({
      data: {
        pages: [
          { orders: [order(1002)], pageInfo: {} },
          { orders: [order(1001)], pageInfo: {} },
        ],
      },
      hasNextPage: false,
    } as never)
    renderPage()
    expect(screen.getByText('#1002').closest('a')).toHaveAttribute('href', '/account/orders/1002')
    expect(screen.getByText('#1001')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument()
  })

  it('loads more when there is a next page', () => {
    session.mockReturnValue(signedIn as never)
    orders.mockReturnValue({
      data: { pages: [{ orders: [order(1002)], pageInfo: {} }] },
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage,
    } as never)
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /load more/i }))
    expect(fetchNextPage).toHaveBeenCalled()
  })

  it('shows the empty state with no Orders', () => {
    session.mockReturnValue(signedIn as never)
    orders.mockReturnValue({ data: { pages: [{ orders: [], pageInfo: {} }] } } as never)
    renderPage()
    expect(screen.getByText(/haven't placed any orders/i)).toBeInTheDocument()
  })
})
