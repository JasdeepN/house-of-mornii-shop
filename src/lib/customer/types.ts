// Data types returned by the customer hooks. Shapes follow the Customer Account API
// (2026-10), not the Storefront API.

/** Decimal amount as a string, as the API returns it. */
export interface Money {
  amount: string
  currencyCode: string
}

export interface Address {
  id: string
  firstName: string | null
  lastName: string | null
  company: string | null
  address1: string | null
  address2: string | null
  city: string | null
  zoneCode: string | null
  zip: string | null
  countryCode: string | null
  phoneNumber: string | null
  formatted: string[]
}

/** Writable address fields (CustomerAddressInput). */
export type AddressInput = Partial<Omit<Address, 'id' | 'formatted'>>

export type EmailMarketingState =
  | 'INVALID'
  | 'NOT_SUBSCRIBED'
  | 'PENDING'
  | 'REDACTED'
  | 'SUBSCRIBED'
  | 'UNSUBSCRIBED'

export interface CustomerProfile {
  id: string
  firstName: string | null
  lastName: string | null
  displayName: string
  emailAddress: { emailAddress: string | null; marketingState: EmailMarketingState } | null
  phoneNumber: { phoneNumber: string } | null
  defaultAddress: Address | null
}

export interface OrderSummary {
  id: string
  name: string
  number: number
  processedAt: string
  financialStatus: string | null
  fulfillmentStatus: string
  totalPrice: Money
}

export interface OrderLineItem {
  id: string
  name: string
  title: string
  variantTitle: string | null
  quantity: number
  image: { url: string; altText: string | null } | null
  price: Money | null
  totalPrice: Money | null
}

export interface OrderDetail extends OrderSummary {
  confirmationNumber: string | null
  cancelledAt: string | null
  statusPageUrl: string
  subtotal: Money | null
  totalShipping: Money
  totalTax: Money | null
  shippingAddress: Address | null
  billingAddress: Address | null
  lineItems: OrderLineItem[]
}

export interface OrdersPage {
  orders: OrderSummary[]
  pageInfo: { hasNextPage: boolean; endCursor: string | null }
}

export interface AddressList {
  addresses: Address[]
  defaultAddressId: string | null
}

export interface CustomerIdentity {
  id: string
  name: string
  email: string
}

export type CustomerSession =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; customer: CustomerIdentity }
