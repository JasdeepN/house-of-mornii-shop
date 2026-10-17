import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useCustomerSession } from './session'

vi.mock('./fetch', () => ({ customerFetch: vi.fn() }))

import { customerFetch } from './fetch'
import { CustomerUserError, SignedOutError } from './errors'
import {
  useAddresses,
  useCreateAddress,
  useCustomerProfile,
  useDeleteAddress,
  useOrder,
  useOrders,
  useSetEmailMarketing,
  useUpdateAddress,
  useUpdateName,
} from './hooks'
import { makeWrapper, stubSession } from './test-utils'

const mocked = vi.mocked(customerFetch)

beforeEach(() => { mocked.mockClear(); mocked.mockImplementation(async () => undefined as never) })
afterEach(() => vi.unstubAllGlobals())

async function signedIn<T>(hook: () => T) {
  stubSession('in')
  const { queryClient, Wrapper } = makeWrapper()
  const rendered = renderHook(
    () => ({ hook: hook(), session: useCustomerSession().session }),
    { wrapper: Wrapper },
  )
  await waitFor(() => expect(rendered.result.current.session.status).toBe('signed-in'))
  return { ...rendered, queryClient }
}

const orderNode = (n: number) => ({
  id: `gid://o/${n}`, name: `#${n}`, number: n, processedAt: '2026-10-01T00:00:00Z',
  financialStatus: 'PAID', fulfillmentStatus: 'UNFULFILLED', totalPrice: { amount: '10.0', currencyCode: 'CAD' },
})

describe('queries', () => {
  it('do not run while signed out', async () => {
    stubSession('out')
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => ({ p: useCustomerProfile(), s: useCustomerSession() }), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.s.session.status).toBe('signed-out'))
    expect(mocked).not.toHaveBeenCalled()
  })

  it('useCustomerProfile returns the customer', async () => {
    mocked.mockResolvedValue({ customer: { id: 'c1', displayName: 'Ada' } })
    const { result } = await signedIn(() => useCustomerProfile())
    await waitFor(() => expect(result.current.hook.data).toEqual({ id: 'c1', displayName: 'Ada' }))
  })

  it('useOrders pages newest first by cursor', async () => {
    mocked
      .mockResolvedValueOnce({ customer: { orders: { nodes: [orderNode(2)], pageInfo: { hasNextPage: true, endCursor: 'cur1' } } } })
      .mockResolvedValueOnce({ customer: { orders: { nodes: [orderNode(1)], pageInfo: { hasNextPage: false, endCursor: null } } } })
    const { result } = await signedIn(() => useOrders())
    await waitFor(() => expect(result.current.hook.data?.pages).toHaveLength(1))
    expect(mocked.mock.calls[0][0]).toContain('reverse: true')
    expect(result.current.hook.hasNextPage).toBe(true)
    await act(async () => { await result.current.hook.fetchNextPage() })
    expect(mocked.mock.calls[1][1]).toMatchObject({ after: 'cur1' })
    await waitFor(() => expect(result.current.hook.hasNextPage).toBe(false))
    expect(result.current.hook.data?.pages.flatMap((p) => p.orders.map((o) => o.number))).toEqual([2, 1])
  })

  it('useOrder fetches by GID and flattens line items', async () => {
    mocked.mockResolvedValue({ order: { ...orderNode(5), lineItems: { nodes: [{ id: 'l1' }] } } })
    const { result } = await signedIn(() => useOrder('gid://o/5'))
    await waitFor(() => expect(result.current.hook.data?.lineItems).toEqual([{ id: 'l1' }]))
    expect(mocked.mock.calls[0][1]).toEqual({ id: 'gid://o/5' })
  })

  it('useAddresses returns addresses and the default id', async () => {
    mocked.mockResolvedValue({ customer: { defaultAddress: { id: 'a1' }, addresses: { nodes: [{ id: 'a1' }, { id: 'a2' }] } } })
    const { result } = await signedIn(() => useAddresses())
    await waitFor(() => expect(result.current.hook.data).toEqual({ addresses: [{ id: 'a1' }, { id: 'a2' }], defaultAddressId: 'a1' }))
  })

  it('a SignedOutError from a query switches the session to signed-out', async () => {
    mocked.mockImplementation(async () => { throw new SignedOutError() })
    stubSession('in')
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => ({ hook: useCustomerProfile(), session: useCustomerSession().session }), { wrapper: Wrapper })
    // The query only runs once signed in, so reaching signed-out proves the listener fired.
    await waitFor(() => expect(mocked).toHaveBeenCalled())
    await waitFor(() => expect(result.current.session.status).toBe('signed-out'))
  })
})

describe('mutations', () => {
  it('create/update/delete address pass the right variables and invalidate addresses and profile', async () => {
    mocked.mockResolvedValue({
      customerAddressCreate: { userErrors: [] },
      customerAddressUpdate: { userErrors: [] },
      customerAddressDelete: { userErrors: [] },
    })
    const { result, queryClient } = await signedIn(() => ({
      create: useCreateAddress(), update: useUpdateAddress(), del: useDeleteAddress(),
    }))
    const spy = vi.spyOn(queryClient, 'invalidateQueries')

    await act(async () => { await result.current.hook.create.mutateAsync({ address: { city: 'Toronto' }, defaultAddress: true }) })
    expect(mocked.mock.calls[0][1]).toEqual({ address: { city: 'Toronto' }, defaultAddress: true })
    const keys = spy.mock.calls.map((c) => (c[0] as { queryKey: unknown[] }).queryKey)
    expect(keys).toContainEqual(['customer', 'addresses'])
    expect(keys).toContainEqual(['customer', 'profile'])

    await act(async () => { await result.current.hook.update.mutateAsync({ id: 'a1', address: { city: 'Ottawa' } }) })
    expect(mocked.mock.calls[1][1]).toEqual({ addressId: 'a1', address: { city: 'Ottawa' }, defaultAddress: false })

    await act(async () => { await result.current.hook.del.mutateAsync('a1') })
    expect(mocked.mock.calls[2][1]).toEqual({ addressId: 'a1' })
  })

  it('userErrors become a CustomerUserError carrying the first message', async () => {
    const userErrors = [{ field: ['address', 'zip'], message: 'Zip is invalid', code: 'INVALID' }, { field: null, message: 'other' }]
    mocked.mockResolvedValue({ customerAddressCreate: { userErrors } })
    const { result } = await signedIn(() => useCreateAddress())
    let error: unknown
    await act(async () => { error = await result.current.hook.mutateAsync({ address: {} }).catch((e) => e) })
    expect(error).toBeInstanceOf(CustomerUserError)
    expect((error as CustomerUserError).message).toBe('Zip is invalid')
    expect((error as CustomerUserError).userErrors).toEqual(userErrors)
  })

  it('useUpdateName sends the input and invalidates only the profile', async () => {
    mocked.mockResolvedValue({ customerUpdate: { userErrors: [] } })
    const { result, queryClient } = await signedIn(() => useUpdateName())
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    await act(async () => { await result.current.hook.mutateAsync({ firstName: 'Ada', lastName: 'L' }) })
    expect(mocked.mock.calls[0][1]).toEqual({ input: { firstName: 'Ada', lastName: 'L' } })
    expect(spy.mock.calls.map((c) => (c[0] as { queryKey: unknown[] }).queryKey)).toEqual([['customer', 'profile']])
  })

  it('useSetEmailMarketing picks subscribe or unsubscribe', async () => {
    mocked.mockResolvedValue({
      customerEmailMarketingSubscribe: { userErrors: [] },
      customerEmailMarketingUnsubscribe: { userErrors: [] },
    })
    const { result } = await signedIn(() => useSetEmailMarketing())
    await act(async () => { await result.current.hook.mutateAsync(true) })
    await act(async () => { await result.current.hook.mutateAsync(false) })
    expect(mocked.mock.calls[0][0]).toContain('customerEmailMarketingSubscribe')
    expect(mocked.mock.calls[1][0]).toContain('customerEmailMarketingUnsubscribe')
  })

  it('a SignedOutError from a mutation switches the session to signed-out', async () => {
    stubSession('in')
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => ({ hook: useDeleteAddress(), session: useCustomerSession().session }), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.session.status).toBe('signed-in'))
    mocked.mockImplementation(async () => { throw new SignedOutError() })
    await act(async () => { await result.current.hook.mutateAsync('a1').catch(() => {}) })
    await waitFor(() => expect(result.current.session.status).toBe('signed-out'))
  })
})
