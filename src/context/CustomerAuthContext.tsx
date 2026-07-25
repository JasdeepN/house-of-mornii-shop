import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import { shopifyFetch } from '@/lib/shopify/client'
import {
  CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION,
  CUSTOMER_ACCESS_TOKEN_DELETE_MUTATION,
  CUSTOMER_ACCESS_TOKEN_RENEW_MUTATION,
  CUSTOMER_CREATE_MUTATION,
  CUSTOMER_RECOVER_MUTATION,
  CUSTOMER_RESET_MUTATION,
  CUSTOMER_UPDATE_MUTATION,
  CUSTOMER_QUERY,
  CUSTOMER_ADDRESS_CREATE_MUTATION,
  CUSTOMER_ADDRESS_UPDATE_MUTATION,
  CUSTOMER_ADDRESS_DELETE_MUTATION,
  CUSTOMER_DEFAULT_ADDRESS_UPDATE_MUTATION,
} from '@/lib/shopify/queries'
import {
  ShopifyCustomer,
  ShopifyCustomerAccessToken,
  ShopifyMailingAddress,
  type CustomerCreateInput,
  type CustomerUpdateInput,
  type MailingAddressInput,
  type ShopifyCustomerUserError,
} from '@/lib/shopify/types'
import { toast } from 'sonner'

const ACCESS_TOKEN_KEY = 'hom-customer-access-token'
const EXPIRES_AT_KEY = 'hom-customer-expires-at'

interface CustomerAuthContextValue {
  customer: ShopifyCustomer | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  lastError: ShopifyCustomerUserError[] | null
  login: (email: string, password: string) => Promise<void>
  register: (input: CustomerCreateInput) => Promise<void>
  logout: () => Promise<void>
  initiatePasswordRecovery: (email: string) => Promise<void>
  resetPassword: (password: string, token: string, id: string) => Promise<void>
  updateProfile: (input: CustomerUpdateInput) => Promise<void>
  refreshAccessToken: () => Promise<void>
  createAddress: (input: MailingAddressInput) => Promise<void>
  updateAddress: (id: string, input: MailingAddressInput) => Promise<void>
  deleteAddress: (id: string) => Promise<void>
  setDefaultAddress: (id: string) => Promise<void>
}

const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null)

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext)
  if (!ctx) throw new Error('useCustomerAuth must be used within <CustomerAuthProvider>')
  return ctx
}

function getStoredToken(): { accessToken: string | null; expiresAt: string | null } {
  return {
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    expiresAt: localStorage.getItem(EXPIRES_AT_KEY),
  }
}

function storeTokens(tokenData: ShopifyCustomerAccessToken) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokenData.accessToken)
  localStorage.setItem(EXPIRES_AT_KEY, tokenData.expiresAt)
}

function clearStoredTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(EXPIRES_AT_KEY)
}

function isTokenExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return true
  return new Date(expiresAt).getTime() <= Date.now()
}

type CustomerQueryResponse = {
  customer?: ShopifyCustomer
}

async function fetchCustomer(accessToken: string): Promise<ShopifyCustomer | null> {
  const res = await shopifyFetch<CustomerQueryResponse>(CUSTOMER_QUERY, { customerAccessToken: accessToken })

  if (!res.customer) {
    return null
  }
  return res.customer
}

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<ShopifyCustomer | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastError, setLastError] = useState<ShopifyCustomerUserError[] | null>(null)

  // Renew the current access token before it expires. Note: Shopify's
  // `customerAccessTokenRenew` mutation takes the existing (still-unexpired)
  // access token directly — there is no separate "recovery token" concept
  // on `CustomerAccessToken`. Once a token has actually expired, it can no
  // longer be renewed; the customer must log in again.
  const refreshStoredToken = useCallback(async (currentAccessToken: string) => {
    type RenewResponse = {
      customerAccessTokenRenew?: {
        customerAccessToken?: ShopifyCustomerAccessToken
        userErrors?: ShopifyCustomerUserError[]
      }
    }

    const res = await shopifyFetch<RenewResponse>(CUSTOMER_ACCESS_TOKEN_RENEW_MUTATION, {
      customerAccessToken: currentAccessToken,
    })

    if (!res.customerAccessTokenRenew?.customerAccessToken) {
      clearStoredTokens()
      setLastError(res.customerAccessTokenRenew?.userErrors ?? [])
      return
    }

    const tokenData = res.customerAccessTokenRenew.customerAccessToken!
    storeTokens(tokenData)
    setAccessToken(tokenData.accessToken)

    const cust = await fetchCustomer(tokenData.accessToken)
    if (cust) {
      setCustomer(cust)
    }
  }, [])

  // Initialize from stored tokens on mount
  useEffect(() => {
    async function init() {
      const { accessToken: storedToken, expiresAt } = getStoredToken()

      if (!storedToken) {
        setIsLoading(false)
        return
      }

      // Token has already expired — it cannot be renewed. Require re-login.
      if (isTokenExpired(expiresAt)) {
        clearStoredTokens()
        setIsLoading(false)
        return
      }

      // Token exists and is valid, fetch customer data
      try {
        const cust = await fetchCustomer(storedToken)
        if (cust) {
          setAccessToken(storedToken)
          setCustomer(cust)
        } else {
          clearStoredTokens()
        }
      } catch {
        clearStoredTokens()
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setLastError(null)
    type LoginResponse = {
      customerAccessTokenCreate?: {
        customerAccessToken?: ShopifyCustomerAccessToken
        customerUserErrors?: ShopifyCustomerUserError[]
      }
    }

    const res = await shopifyFetch<LoginResponse>(CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION, {
      input: { email, password },
    })

    const createResult = res.customerAccessTokenCreate
    if (createResult?.customerUserErrors && createResult.customerUserErrors.length > 0) {
      setLastError(createResult.customerUserErrors)
      throw new Error(createResult.customerUserErrors[0].message)
    }

    if (!createResult?.customerAccessToken) {
      const message = 'Login failed. Please check your credentials.'
      setLastError([{ field: null, message, code: 'UNKNOWN' }])
      throw new Error(message)
    }

    const tokenData = createResult.customerAccessToken!
    storeTokens(tokenData)
    setAccessToken(tokenData.accessToken)
    
    const cust = await fetchCustomer(tokenData.accessToken)
    if (cust) {
      setCustomer(cust)
    }
  }, [])

  const register = useCallback(async (input: CustomerCreateInput) => {
    setLastError(null)
    type RegisterResponse = {
      customerCreate?: {
        customer?: ShopifyCustomer
        customerUserErrors?: ShopifyCustomerUserError[]
      }
    }

    const res = await shopifyFetch<RegisterResponse>(CUSTOMER_CREATE_MUTATION, { input })

    const createResult = res.customerCreate
    if (createResult?.customerUserErrors && createResult.customerUserErrors.length > 0) {
      setLastError(createResult.customerUserErrors)
      throw new Error(createResult.customerUserErrors[0].message)
    }

    if (!createResult?.customer) {
      throw new Error('Registration failed. Please try again.')
    }

    toast.success('Account created! Please sign in.')
  }, [])

  const logout = useCallback(async () => {
    if (!accessToken) {
      clearStoredTokens()
      setCustomer(null)
      setAccessToken(null)
      return
    }

    try {
      await shopifyFetch(CUSTOMER_ACCESS_TOKEN_DELETE_MUTATION, {
        customerAccessToken: accessToken,
      })
    } catch {
      // Even if the API call fails, clear local state
    } finally {
      clearStoredTokens()
      setCustomer(null)
      setAccessToken(null)
    }
  }, [accessToken])

  const initiatePasswordRecovery = useCallback(async (email: string) => {
    setLastError(null)
    type RecoverResponse = {
      customerRecover?: {
        customerUserErrors?: ShopifyCustomerUserError[]
      }
    }

    const res = await shopifyFetch<RecoverResponse>(CUSTOMER_RECOVER_MUTATION, {
      email,
    })

    const recoverResult = res.customerRecover
    if (recoverResult?.customerUserErrors && recoverResult.customerUserErrors.length > 0) {
      setLastError(recoverResult.customerUserErrors)
      throw new Error(recoverResult.customerUserErrors[0].message)
    }
    // Shopify always returns success even if email doesn't exist (security measure)
  }, [])

  const resetPassword = useCallback(async (password: string, token: string, id: string) => {
    setLastError(null)
    type ResetResponse = {
      customerReset?: {
        customerAccessToken?: ShopifyCustomerAccessToken
        customerUserErrors?: ShopifyCustomerUserError[]
      }
    }

    const res = await shopifyFetch<ResetResponse>(CUSTOMER_RESET_MUTATION, {
      id,
      input: { password, resetToken: token },
    })

    const resetResult = res.customerReset
    if (resetResult?.customerUserErrors && resetResult.customerUserErrors.length > 0) {
      setLastError(resetResult.customerUserErrors)
      throw new Error(resetResult.customerUserErrors[0].message)
    }

    if (!resetResult?.customerAccessToken) {
      throw new Error('Password reset failed. Please try again.')
    }

    const tokenData = resetResult.customerAccessToken!
    storeTokens(tokenData)
    setAccessToken(tokenData.accessToken)
    
    const cust = await fetchCustomer(tokenData.accessToken)
    if (cust) {
      setCustomer(cust)
    }
  }, [])

  const updateProfile = useCallback(async (input: CustomerUpdateInput) => {
    if (!accessToken) return

    setLastError(null)
    type UpdateResponse = {
      customerUpdate?: {
        customer?: ShopifyCustomer
        customerAccessToken?: ShopifyCustomerAccessToken
        customerUserErrors?: ShopifyCustomerUserError[]
      }
    }

    const res = await shopifyFetch<UpdateResponse>(CUSTOMER_UPDATE_MUTATION, {
      customerAccessToken: accessToken,
      customer: input,
    })

    const updateResult = res.customerUpdate
    if (updateResult?.customerUserErrors && updateResult.customerUserErrors.length > 0) {
      setLastError(updateResult.customerUserErrors)
      throw new Error(updateResult.customerUserErrors[0].message)
    }

    if (!updateResult?.customer) {
      throw new Error('Profile update failed. Please try again.')
    }

    setCustomer(updateResult.customer)

    // Changing the password invalidates all previous access tokens — Shopify
    // returns a fresh one in the payload when that happens.
    if (updateResult.customerAccessToken) {
      storeTokens(updateResult.customerAccessToken)
      setAccessToken(updateResult.customerAccessToken.accessToken)
    }
  }, [accessToken])

  const refreshAccessToken = useCallback(async () => {
    const { accessToken: storedToken, expiresAt } = getStoredToken()
    if (!storedToken || isTokenExpired(expiresAt)) {
      throw new Error('No renewable access token available. Please sign in again.')
    }
    await refreshStoredToken(storedToken)
  }, [refreshStoredToken])

  const createAddress = useCallback(async (input: MailingAddressInput) => {
    if (!accessToken) return

    setLastError(null)
    type CreateAddressResponse = {
      customerAddressCreate?: {
        customerAddress?: ShopifyMailingAddress
        customerUserErrors?: ShopifyCustomerUserError[]
      }
    }

    const res = await shopifyFetch<CreateAddressResponse>(CUSTOMER_ADDRESS_CREATE_MUTATION, {
      address: input,
      customerAccessToken: accessToken,
    })

    const result = res.customerAddressCreate
    if (result?.customerUserErrors && result.customerUserErrors.length > 0) {
      setLastError(result.customerUserErrors)
      throw new Error(result.customerUserErrors[0].message)
    }
    if (!result?.customerAddress) {
      throw new Error('Failed to add address. Please try again.')
    }

    const cust = await fetchCustomer(accessToken)
    if (cust) setCustomer(cust)
  }, [accessToken])

  const updateAddress = useCallback(async (id: string, input: MailingAddressInput) => {
    if (!accessToken) return

    setLastError(null)
    type UpdateAddressResponse = {
      customerAddressUpdate?: {
        customerAddress?: ShopifyMailingAddress
        customerUserErrors?: ShopifyCustomerUserError[]
      }
    }

    const res = await shopifyFetch<UpdateAddressResponse>(CUSTOMER_ADDRESS_UPDATE_MUTATION, {
      address: input,
      customerAccessToken: accessToken,
      id,
    })

    const result = res.customerAddressUpdate
    if (result?.customerUserErrors && result.customerUserErrors.length > 0) {
      setLastError(result.customerUserErrors)
      throw new Error(result.customerUserErrors[0].message)
    }
    if (!result?.customerAddress) {
      throw new Error('Failed to update address. Please try again.')
    }

    const cust = await fetchCustomer(accessToken)
    if (cust) setCustomer(cust)
  }, [accessToken])

  const deleteAddress = useCallback(async (id: string) => {
    if (!accessToken) return

    setLastError(null)
    type DeleteAddressResponse = {
      customerAddressDelete?: {
        deletedCustomerAddressId?: string
        customerUserErrors?: ShopifyCustomerUserError[]
      }
    }

    const res = await shopifyFetch<DeleteAddressResponse>(CUSTOMER_ADDRESS_DELETE_MUTATION, {
      customerAccessToken: accessToken,
      id,
    })

    const result = res.customerAddressDelete
    if (result?.customerUserErrors && result.customerUserErrors.length > 0) {
      setLastError(result.customerUserErrors)
      throw new Error(result.customerUserErrors[0].message)
    }
    if (!result?.deletedCustomerAddressId) {
      throw new Error('Failed to delete address. Please try again.')
    }

    const cust = await fetchCustomer(accessToken)
    if (cust) setCustomer(cust)
  }, [accessToken])

  const setDefaultAddress = useCallback(async (id: string) => {
    if (!accessToken) return

    setLastError(null)
    type DefaultAddressResponse = {
      customerDefaultAddressUpdate?: {
        customer?: ShopifyCustomer
        customerUserErrors?: ShopifyCustomerUserError[]
      }
    }

    const res = await shopifyFetch<DefaultAddressResponse>(CUSTOMER_DEFAULT_ADDRESS_UPDATE_MUTATION, {
      addressId: id,
      customerAccessToken: accessToken,
    })

    const result = res.customerDefaultAddressUpdate
    if (result?.customerUserErrors && result.customerUserErrors.length > 0) {
      setLastError(result.customerUserErrors)
      throw new Error(result.customerUserErrors[0].message)
    }
    if (!result?.customer) {
      throw new Error('Failed to set default address. Please try again.')
    }

    const cust = await fetchCustomer(accessToken)
    if (cust) setCustomer(cust)
  }, [accessToken])

  const value: CustomerAuthContextValue = {
    customer,
    accessToken,
    isAuthenticated: !!accessToken && !!customer,
    isLoading,
    lastError,
    login,
    register,
    logout,
    initiatePasswordRecovery,
    resetPassword,
    updateProfile,
    refreshAccessToken,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  }

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  )
}
