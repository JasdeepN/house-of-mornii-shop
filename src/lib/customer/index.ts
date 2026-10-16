export { customerFetch } from './fetch'
export { SignedOutError, CustomerUserError } from './errors'
export type { UserError } from './errors'
export { CustomerSessionProvider, useCustomerSession } from './session'
export {
  useCustomerProfile,
  useOrders,
  useOrder,
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  useUpdateName,
  useSetEmailMarketing,
} from './hooks'
export type {
  Address,
  AddressInput,
  AddressList,
  CustomerIdentity,
  CustomerProfile,
  CustomerSession,
  EmailMarketingState,
  Money,
  OrderDetail,
  OrderLineItem,
  OrderSummary,
  OrdersPage,
} from './types'
