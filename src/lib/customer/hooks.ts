import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { customerFetch } from './fetch'
import { assertNoUserErrors, SignedOutError, type UserError } from './errors'
import { useCustomerSession } from './session'
import {
  ADDRESSES_QUERY,
  ADDRESS_CREATE_MUTATION,
  ADDRESS_DELETE_MUTATION,
  ADDRESS_UPDATE_MUTATION,
  CUSTOMER_UPDATE_MUTATION,
  EMAIL_MARKETING_SUBSCRIBE_MUTATION,
  EMAIL_MARKETING_UNSUBSCRIBE_MUTATION,
  ORDERS_QUERY,
  ORDER_QUERY,
  PROFILE_QUERY,
} from './documents'
import type {
  Address,
  AddressInput,
  AddressList,
  CustomerProfile,
  OrderDetail,
  OrderSummary,
  OrdersPage,
} from './types'

const PAGE_SIZE = 10

export const customerKeys = {
  profile: ['customer', 'profile'] as const,
  orders: ['customer', 'orders'] as const,
  order: (id: string) => ['customer', 'order', id] as const,
  addresses: ['customer', 'addresses'] as const,
}

// A signed-out answer is final; anything else gets one retry.
const retry = (failureCount: number, error: unknown) => !(error instanceof SignedOutError) && failureCount < 1

function useSignedIn(): boolean {
  return useCustomerSession().session.status === 'signed-in'
}

export function useCustomerProfile() {
  const enabled = useSignedIn()
  return useQuery({
    queryKey: customerKeys.profile,
    enabled,
    retry,
    queryFn: async (): Promise<CustomerProfile> => {
      const data = await customerFetch<{ customer: CustomerProfile }>(PROFILE_QUERY)
      return data.customer
    },
  })
}

export function useOrders() {
  const enabled = useSignedIn()
  return useInfiniteQuery({
    queryKey: customerKeys.orders,
    enabled,
    retry,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }): Promise<OrdersPage> => {
      const data = await customerFetch<{
        customer: { orders: { nodes: OrderSummary[]; pageInfo: OrdersPage['pageInfo'] } }
      }>(ORDERS_QUERY, { first: PAGE_SIZE, after: pageParam })
      return { orders: data.customer.orders.nodes, pageInfo: data.customer.orders.pageInfo }
    },
    getNextPageParam: (last) => (last.pageInfo.hasNextPage ? last.pageInfo.endCursor : undefined),
  })
}

/** `id` is the Order's GID. */
export function useOrder(id: string) {
  const enabled = useSignedIn()
  return useQuery({
    queryKey: customerKeys.order(id),
    enabled,
    retry,
    queryFn: async (): Promise<OrderDetail | null> => {
      const data = await customerFetch<{
        order: (Omit<OrderDetail, 'lineItems'> & { lineItems: { nodes: OrderDetail['lineItems'] } }) | null
      }>(ORDER_QUERY, { id })
      if (!data.order) return null
      return { ...data.order, lineItems: data.order.lineItems.nodes }
    },
  })
}

export function useAddresses() {
  const enabled = useSignedIn()
  return useQuery({
    queryKey: customerKeys.addresses,
    enabled,
    retry,
    queryFn: async (): Promise<AddressList> => {
      const data = await customerFetch<{
        customer: { defaultAddress: { id: string } | null; addresses: { nodes: Address[] } }
      }>(ADDRESSES_QUERY)
      return {
        addresses: data.customer.addresses.nodes,
        defaultAddressId: data.customer.defaultAddress?.id ?? null,
      }
    },
  })
}

function useInvalidating<TVars>(
  mutationFn: (vars: TVars) => Promise<unknown>,
  keys: readonly (readonly unknown[])[],
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))),
  })
}

const addressKeys = [customerKeys.addresses, customerKeys.profile] as const

type Payload = { userErrors: UserError[] }

export function useCreateAddress() {
  return useInvalidating(async (vars: { address: AddressInput; defaultAddress?: boolean }) => {
    const data = await customerFetch<{ customerAddressCreate: Payload }>(ADDRESS_CREATE_MUTATION, {
      address: vars.address,
      defaultAddress: vars.defaultAddress ?? false,
    })
    assertNoUserErrors(data.customerAddressCreate)
  }, addressKeys)
}

export function useUpdateAddress() {
  return useInvalidating(async (vars: { id: string; address: AddressInput; defaultAddress?: boolean }) => {
    const data = await customerFetch<{ customerAddressUpdate: Payload }>(ADDRESS_UPDATE_MUTATION, {
      addressId: vars.id,
      address: vars.address,
      defaultAddress: vars.defaultAddress ?? false,
    })
    assertNoUserErrors(data.customerAddressUpdate)
  }, addressKeys)
}

/** Variable is the address ID. */
export function useDeleteAddress() {
  return useInvalidating(async (addressId: string) => {
    const data = await customerFetch<{ customerAddressDelete: Payload }>(ADDRESS_DELETE_MUTATION, { addressId })
    assertNoUserErrors(data.customerAddressDelete)
  }, addressKeys)
}

export function useUpdateName() {
  return useInvalidating(async (vars: { firstName: string; lastName: string }) => {
    const data = await customerFetch<{ customerUpdate: Payload }>(CUSTOMER_UPDATE_MUTATION, { input: vars })
    assertNoUserErrors(data.customerUpdate)
  }, [customerKeys.profile])
}

/** Variable is `subscribed`: true subscribes, false unsubscribes. */
export function useSetEmailMarketing() {
  return useInvalidating(async (subscribed: boolean) => {
    if (subscribed) {
      const data = await customerFetch<{ customerEmailMarketingSubscribe: Payload }>(
        EMAIL_MARKETING_SUBSCRIBE_MUTATION,
      )
      assertNoUserErrors(data.customerEmailMarketingSubscribe)
    } else {
      const data = await customerFetch<{ customerEmailMarketingUnsubscribe: Payload }>(
        EMAIL_MARKETING_UNSUBSCRIBE_MUTATION,
      )
      assertNoUserErrors(data.customerEmailMarketingUnsubscribe)
    }
  }, [customerKeys.profile])
}
