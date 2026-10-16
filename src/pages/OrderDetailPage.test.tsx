import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { OrderDetailPage } from './OrderDetailPage'
import { useCustomerSession, useOrder } from '@/lib/customer'

vi.mock('@/lib/customer', () => ({ useCustomerSession: vi.fn(), useOrder: vi.fn() }))
const open = vi.fn()
vi.mock('@/context/SignInDialogContext', () => ({ useSignInDialog: () => ({ open }) }))

const session = vi.mocked(useCustomerSession)
const useOrderMock = vi.mocked(useOrder)

const money = (amount: string) => ({ amount, currencyCode: 'CAD' })
const ORDER = {
  id: 'gid://shopify/Order/123',
  name: '#1123',
  number: 1123,
  processedAt: '2026-01-02T12:00:00Z',
  financialStatus: 'PAID',
  fulfillmentStatus: 'UNFULFILLED',
  totalPrice: money('52.00'),
  confirmationNumber: null,
  cancelledAt: null,
  statusPageUrl: 'https://example.com/status',
  subtotal: money('40.00'),
  totalShipping: money('10.00'),
  totalTax: money('2.00'),
  shippingAddress: {
    id: 'a',
    firstName: 'Jane',
    lastName: 'Doe',
    company: null,
    address1: '1 Main',
    address2: null,
    city: 'Ottawa',
    zoneCode: 'ON',
    zip: 'K1A',
    countryCode: 'CA',
    phoneNumber: null,
    formatted: ['Jane Doe', '1 Main', 'Ottawa ON K1A', 'Canada'],
  },
  billingAddress: null,
  lineItems: [
    {
      id: 'l1',
      name: 'Ring - Gold',
      title: 'Ring',
      variantTitle: 'Gold',
      quantity: 2,
      image: null,
      price: money('20.00'),
      totalPrice: money('40.00'),
    },
  ],
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/account/orders/123']}>
      <Routes>
        <Route path="/account/orders/:orderId" element={<OrderDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

const signedIn = { session: { status: 'signed-in', customer: { id: 'c', name: 'J', email: 'j@x.com' } } }

describe('OrderDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useOrderMock.mockReturnValue({ data: ORDER, isLoading: false } as never)
  })

  it('opens the sign-in dialog when signed out', () => {
    session.mockReturnValue({ session: { status: 'signed-out' } } as never)
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(open).toHaveBeenCalled()
  })

  it('turns the route param into the Order GID', () => {
    session.mockReturnValue(signedIn as never)
    renderPage()
    expect(useOrderMock).toHaveBeenCalledWith('gid://shopify/Order/123')
  })

  it('renders items, totals, status and shipping address', () => {
    session.mockReturnValue(signedIn as never)
    renderPage()
    expect(screen.getByRole('heading', { name: 'ORDER #1123' })).toBeInTheDocument()
    expect(screen.getByText('Ring')).toBeInTheDocument()
    expect(screen.getByText('Quantity: 2')).toBeInTheDocument()
    expect(screen.getByText('52.00 CAD')).toBeInTheDocument()
    expect(screen.getByText('1 Main')).toBeInTheDocument()
    expect(screen.getByText('paid')).toBeInTheDocument()
  })

  it('shows not found when the Order is null', () => {
    session.mockReturnValue(signedIn as never)
    useOrderMock.mockReturnValue({ data: null, isLoading: false } as never)
    renderPage()
    expect(screen.getByText('ORDER NOT FOUND')).toBeInTheDocument()
  })

  it('shows loading while the Order loads', () => {
    session.mockReturnValue(signedIn as never)
    useOrderMock.mockReturnValue({ data: undefined, isLoading: true } as never)
    renderPage()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})
