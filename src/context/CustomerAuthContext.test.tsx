import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type {
  ShopifyCustomer,
  ShopifyCustomerAccessToken,
  ShopifyMailingAddress,
} from '@/lib/shopify/types'

const ACCESS_TOKEN_KEY = 'hom-customer-access-token'
const EXPIRES_AT_KEY = 'hom-customer-expires-at'

const FAKE_TOKEN: ShopifyCustomerAccessToken = {
  accessToken: 'test-access-token',
  expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
}

const BASE_CUSTOMER: ShopifyCustomer = {
  id: 'gid://shopify/Customer/1',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  phone: null,
  acceptsMarketing: false,
  defaultAddress: null,
  addresses: { edges: [] },
  orders: { edges: [], pageInfo: { hasNextPage: false, endCursor: null } },
}

const FAKE_ADDRESS: ShopifyMailingAddress = {
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

/**
 * Seeds localStorage with a valid, unexpired access token so that the
 * provider's mount-time init() effect fetches the customer automatically.
 */
function seedStoredToken() {
  localStorage.setItem(ACCESS_TOKEN_KEY, FAKE_TOKEN.accessToken)
  localStorage.setItem(EXPIRES_AT_KEY, FAKE_TOKEN.expiresAt)
}

describe('CustomerAuthContext — configured mode, no access token', () => {
  const shopifyFetch = vi.fn()

  beforeEach(async () => {
    vi.resetModules()
    localStorage.clear()
    shopifyFetch.mockReset()
    vi.doMock('@/lib/shopify/client', () => ({
      IS_CONFIGURED: true,
      shopifyFetch,
    }))
  })

  afterEach(() => {
    vi.doUnmock('@/lib/shopify/client')
  })

  async function renderAuth() {
    const { CustomerAuthProvider, useCustomerAuth } = await import('./CustomerAuthContext')
    const { result } = renderHook(() => useCustomerAuth(), {
      wrapper: ({ children }) => <CustomerAuthProvider>{children}</CustomerAuthProvider>,
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    return result
  }

  it('address methods no-op when configured but unauthenticated (no accessToken)', async () => {
    const result = await renderAuth()
    expect(result.current.accessToken).toBeNull()

    await act(async () => {
      await result.current.createAddress({ address1: '123 Main St' })
      await result.current.updateAddress('id', { city: 'Ottawa' })
      await result.current.deleteAddress('id')
      await result.current.setDefaultAddress('id')
    })

    expect(shopifyFetch).not.toHaveBeenCalled()
  })
})

describe('CustomerAuthContext — configured + authenticated', () => {
  const shopifyFetch = vi.fn()

  beforeEach(async () => {
    vi.resetModules()
    localStorage.clear()
    shopifyFetch.mockReset()
    seedStoredToken()
    vi.doMock('@/lib/shopify/client', () => ({
      IS_CONFIGURED: true,
      shopifyFetch,
    }))
  })

  afterEach(() => {
    vi.doUnmock('@/lib/shopify/client')
  })

  /**
   * Renders the provider with a seeded, valid access token. The initial
   * mount-time init() effect issues a CUSTOMER_QUERY call which we resolve
   * with `initialCustomer` before returning the hook result.
   */
  async function renderAuthenticated(initialCustomer: ShopifyCustomer = BASE_CUSTOMER) {
    shopifyFetch.mockResolvedValueOnce({ customer: initialCustomer })

    const { CustomerAuthProvider, useCustomerAuth } = await import('./CustomerAuthContext')
    const { result } = renderHook(() => useCustomerAuth(), {
      wrapper: ({ children }) => <CustomerAuthProvider>{children}</CustomerAuthProvider>,
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true))
    shopifyFetch.mockClear()
    return result
  }

  describe('createAddress', () => {
    it('success path calls mutation then refetches customer', async () => {
      const result = await renderAuthenticated()
      const updatedCustomer: ShopifyCustomer = {
        ...BASE_CUSTOMER,
        addresses: { edges: [{ node: FAKE_ADDRESS }] },
      }

      shopifyFetch
        .mockResolvedValueOnce({
          customerAddressCreate: { customerAddress: FAKE_ADDRESS, customerUserErrors: [] },
        })
        .mockResolvedValueOnce({ customer: updatedCustomer })

      await act(async () => {
        await result.current.createAddress({ address1: '123 Main St' })
      })

      expect(shopifyFetch).toHaveBeenCalledTimes(2)
      const [mutationCall] = shopifyFetch.mock.calls
      expect(mutationCall[0]).toContain('customerAddressCreate')
      expect(mutationCall[1]).toMatchObject({
        address: { address1: '123 Main St' },
        customerAccessToken: FAKE_TOKEN.accessToken,
      })
      expect(result.current.customer).toEqual(updatedCustomer)
    })

    it('throws with customerUserErrors message and sets lastError', async () => {
      const result = await renderAuthenticated()
      shopifyFetch.mockResolvedValueOnce({
        customerAddressCreate: {
          customerAddress: null,
          customerUserErrors: [{ field: ['address1'], message: 'Address1 required', code: 'BLANK' }],
        },
      })

      await act(async () => {
        await expect(
          result.current.createAddress({ address1: '' }),
        ).rejects.toThrow('Address1 required')
      })

      expect(result.current.lastError).toEqual([
        { field: ['address1'], message: 'Address1 required', code: 'BLANK' },
      ])
    })

    it('throws generic fallback message when result payload missing', async () => {
      const result = await renderAuthenticated()
      shopifyFetch.mockResolvedValueOnce({ customerAddressCreate: { customerUserErrors: [] } })

      await act(async () => {
        await expect(
          result.current.createAddress({ address1: '123 Main St' }),
        ).rejects.toThrow('Failed to add address. Please try again.')
      })
    })
  })

  describe('updateAddress', () => {
    it('success path calls mutation with id + address then refetches customer', async () => {
      const result = await renderAuthenticated()
      const updatedAddress = { ...FAKE_ADDRESS, city: 'Toronto' }
      const updatedCustomer: ShopifyCustomer = {
        ...BASE_CUSTOMER,
        addresses: { edges: [{ node: updatedAddress }] },
      }

      shopifyFetch
        .mockResolvedValueOnce({
          customerAddressUpdate: { customerAddress: updatedAddress, customerUserErrors: [] },
        })
        .mockResolvedValueOnce({ customer: updatedCustomer })

      await act(async () => {
        await result.current.updateAddress(FAKE_ADDRESS.id, { city: 'Toronto' })
      })

      expect(shopifyFetch).toHaveBeenCalledTimes(2)
      const [mutationCall] = shopifyFetch.mock.calls
      expect(mutationCall[0]).toContain('customerAddressUpdate')
      expect(mutationCall[1]).toMatchObject({
        id: FAKE_ADDRESS.id,
        address: { city: 'Toronto' },
        customerAccessToken: FAKE_TOKEN.accessToken,
      })
      expect(result.current.customer).toEqual(updatedCustomer)
    })

    it('throws with customerUserErrors message', async () => {
      const result = await renderAuthenticated()
      shopifyFetch.mockResolvedValueOnce({
        customerAddressUpdate: {
          customerAddress: null,
          customerUserErrors: [{ field: ['zip'], message: 'Zip is invalid', code: 'INVALID' }],
        },
      })

      await act(async () => {
        await expect(
          result.current.updateAddress(FAKE_ADDRESS.id, { zip: 'bad' }),
        ).rejects.toThrow('Zip is invalid')
      })
    })

    it('throws generic fallback message when update fails without userErrors', async () => {
      const result = await renderAuthenticated()
      shopifyFetch.mockResolvedValueOnce({ customerAddressUpdate: { customerUserErrors: [] } })

      await act(async () => {
        await expect(
          result.current.updateAddress(FAKE_ADDRESS.id, { city: 'Toronto' }),
        ).rejects.toThrow('Failed to update address. Please try again.')
      })
    })
  })

  describe('deleteAddress', () => {
    it('success path calls mutation then refetches customer', async () => {
      const result = await renderAuthenticated()
      const updatedCustomer: ShopifyCustomer = { ...BASE_CUSTOMER, addresses: { edges: [] } }

      shopifyFetch
        .mockResolvedValueOnce({
          customerAddressDelete: {
            deletedCustomerAddressId: FAKE_ADDRESS.id,
            customerUserErrors: [],
          },
        })
        .mockResolvedValueOnce({ customer: updatedCustomer })

      await act(async () => {
        await result.current.deleteAddress(FAKE_ADDRESS.id)
      })

      expect(shopifyFetch).toHaveBeenCalledTimes(2)
      const [mutationCall] = shopifyFetch.mock.calls
      expect(mutationCall[0]).toContain('customerAddressDelete')
      expect(mutationCall[1]).toMatchObject({
        id: FAKE_ADDRESS.id,
        customerAccessToken: FAKE_TOKEN.accessToken,
      })
      expect(result.current.customer).toEqual(updatedCustomer)
    })

    it('throws with customerUserErrors message', async () => {
      const result = await renderAuthenticated()
      shopifyFetch.mockResolvedValueOnce({
        customerAddressDelete: {
          deletedCustomerAddressId: null,
          customerUserErrors: [{ field: null, message: 'Address not found', code: 'NOT_FOUND' }],
        },
      })

      await act(async () => {
        await expect(result.current.deleteAddress(FAKE_ADDRESS.id)).rejects.toThrow(
          'Address not found',
        )
      })
    })

    it('throws generic fallback message when deletedCustomerAddressId missing', async () => {
      const result = await renderAuthenticated()
      shopifyFetch.mockResolvedValueOnce({
        customerAddressDelete: { customerUserErrors: [] },
      })

      await act(async () => {
        await expect(result.current.deleteAddress(FAKE_ADDRESS.id)).rejects.toThrow(
          'Failed to delete address. Please try again.',
        )
      })
    })
  })

  describe('setDefaultAddress', () => {
    it('success path calls mutation then refetches customer', async () => {
      const result = await renderAuthenticated()
      const updatedCustomer: ShopifyCustomer = {
        ...BASE_CUSTOMER,
        defaultAddress: { id: FAKE_ADDRESS.id },
      }

      shopifyFetch
        .mockResolvedValueOnce({
          customerDefaultAddressUpdate: {
            customer: { id: BASE_CUSTOMER.id, defaultAddress: { id: FAKE_ADDRESS.id } },
            customerUserErrors: [],
          },
        })
        .mockResolvedValueOnce({ customer: updatedCustomer })

      await act(async () => {
        await result.current.setDefaultAddress(FAKE_ADDRESS.id)
      })

      expect(shopifyFetch).toHaveBeenCalledTimes(2)
      const [mutationCall] = shopifyFetch.mock.calls
      expect(mutationCall[0]).toContain('customerDefaultAddressUpdate')
      expect(mutationCall[1]).toMatchObject({
        addressId: FAKE_ADDRESS.id,
        customerAccessToken: FAKE_TOKEN.accessToken,
      })
      expect(result.current.customer).toEqual(updatedCustomer)
    })

    it('throws with customerUserErrors message', async () => {
      const result = await renderAuthenticated()
      shopifyFetch.mockResolvedValueOnce({
        customerDefaultAddressUpdate: {
          customer: null,
          customerUserErrors: [{ field: null, message: 'Cannot set default', code: 'INVALID' }],
        },
      })

      await act(async () => {
        await expect(result.current.setDefaultAddress(FAKE_ADDRESS.id)).rejects.toThrow(
          'Cannot set default',
        )
      })
    })

    it('throws generic fallback message when customer missing from response', async () => {
      const result = await renderAuthenticated()
      shopifyFetch.mockResolvedValueOnce({
        customerDefaultAddressUpdate: { customerUserErrors: [] },
      })

      await act(async () => {
        await expect(result.current.setDefaultAddress(FAKE_ADDRESS.id)).rejects.toThrow(
          'Failed to set default address. Please try again.',
        )
      })
    })
  })
})
