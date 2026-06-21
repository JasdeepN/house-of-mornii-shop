import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import { IS_CONFIGURED } from '@/lib/shopify/client'
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
} from '@/lib/shopify/queries'
import {
  ShopifyCustomer,
  ShopifyCustomerAccessToken,
  type CustomerCreateInput,
  type CustomerUpdateInput,
  type ShopifyCustomerUserError,
} from '@/lib/shopify/types'
import { toast } from 'sonner'

const ACCESS_TOKEN_KEY = 'hom-customer-access-token'
const RECOVERY_TOKEN_KEY = 'hom-customer-recovery-token'
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
}

const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null)

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext)
  if (!ctx) throw new Error('useCustomerAuth must be used within <CustomerAuthProvider>')
  return ctx
}

function getStoredToken(): { accessToken: string | null; recoveryToken: string | null; expiresAt: string | null } {
  return {
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    recoveryToken: localStorage.getItem(RECOVERY_TOKEN_KEY),
    expiresAt: localStorage.getItem(EXPIRES_AT_KEY),
  }
}

function storeTokens(tokenData: ShopifyCustomerAccessToken) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokenData.accessToken)
  localStorage.setItem(EXPIRES_AT_KEY, tokenData.expiresAt)
  if (tokenData.recoveryToken) {
    localStorage.setItem(RECOVERY_TOKEN_KEY, tokenData.recoveryToken)
  }
}

function clearStoredTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(RECOVERY_TOKEN_KEY)
  localStorage.removeItem(EXPIRES_AT_KEY)
}

function isTokenExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return true
  return new Date(expiresAt).getTime() <= Date.now()
}

type CustomerQueryResponse = {
  data?: {
    customer?: ShopifyCustomer
  }
  errors?: unknown[]
}

async function fetchCustomer(accessToken: string): Promise<ShopifyCustomer | null> {
  const res = await shopifyFetch<CustomerQueryResponse>(CUSTOMER_QUERY, { customerAccessToken: accessToken })
  
  if (res.errors || !res.data?.customer) {
    return null
  }
  return res.data.customer
}

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<ShopifyCustomer | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastError, setLastError] = useState<ShopifyCustomerUserError[] | null>(null)

  // Initialize from stored tokens on mount
  useEffect(() => {
    async function init() {
      if (!IS_CONFIGURED) {
        setIsLoading(false)
        return
      }

      const { accessToken: storedToken, recoveryToken, expiresAt } = getStoredToken()
      
      if (!storedToken) {
        setIsLoading(false)
        return
      }

      // If token is expired but we have a recovery token, try to renew
      if (isTokenExpired(expiresAt) && recoveryToken) {
        try {
          await refreshStoredToken(recoveryToken)
          return
        } catch {
          clearStoredTokens()
          setIsLoading(false)
          return
        }
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

  const refreshStoredToken = useCallback(async (recoveryToken: string) => {
    if (!IS_CONFIGURED) return
    
    type RenewResponse = {
      data?: {
        customerAccessTokenRenew?: {
          customerAccessToken?: ShopifyCustomerAccessToken
          userErrors?: ShopifyCustomerUserError[]
        }
      }
      errors?: unknown[]
    }
    
    const res = await shopifyFetch<RenewResponse>(CUSTOMER_ACCESS_TOKEN_RENEW_MUTATION, {
      input: { customerAccessToken: recoveryToken },
    })
    
    if (res.errors || !res.data?.customerAccessTokenRenew?.customerAccessToken) {
      clearStoredTokens()
      setLastError(res.data?.customerAccessTokenRenew?.userErrors ?? [])
      return
    }

    const tokenData = res.data.customerAccessTokenRenew.customerAccessToken!
    storeTokens(tokenData)
    setAccessToken(tokenData.accessToken)
    
    const cust = await fetchCustomer(tokenData.accessToken)
    if (cust) {
      setCustomer(cust)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    if (!IS_CONFIGURED) {
      toast.info('Demo mode: Customer authentication is disabled')
      return
    }

    setLastError(null)
    type LoginResponse = {
      data?: {
        customerAccessTokenCreate?: {
          customerAccessToken?: ShopifyCustomerAccessToken
          customerUserErrors?: ShopifyCustomerUserError[]
        }
      }
      errors?: unknown[]
    }
    
    const res = await shopifyFetch<LoginResponse>(CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION, {
      input: { email, password },
    })
    
    const createResult = res.data?.customerAccessTokenCreate
    if (createResult?.customerUserErrors && createResult.customerUserErrors.length > 0) {
      setLastError(createResult.customerUserErrors)
      throw new Error(createResult.customerUserErrors[0].message)
    }

    if (res.errors || !createResult?.customerAccessToken) {
      throw new Error('Login failed. Please check your credentials.')
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
    if (!IS_CONFIGURED) {
      toast.info('Demo mode: Customer registration is disabled')
      return
    }

    setLastError(null)
    type RegisterResponse = {
      data?: {
        customerCreate?: {
          customer?: ShopifyCustomer
          customerUserErrors?: ShopifyCustomerUserError[]
        }
      }
      errors?: unknown[]
    }
    
    const res = await shopifyFetch<RegisterResponse>(CUSTOMER_CREATE_MUTATION, { input })
    
    const createResult = res.data?.customerCreate
    if (createResult?.customerUserErrors && createResult.customerUserErrors.length > 0) {
      setLastError(createResult.customerUserErrors)
      throw new Error(createResult.customerUserErrors[0].message)
    }

    if (res.errors || !createResult?.customer) {
      throw new Error('Registration failed. Please try again.')
    }

    toast.success('Account created! Please sign in.')
  }, [])

  const logout = useCallback(async () => {
    if (!IS_CONFIGURED || !accessToken) {
      clearStoredTokens()
      setCustomer(null)
      setAccessToken(null)
      return
    }

    try {
      await shopifyFetch(CUSTOMER_ACCESS_TOKEN_DELETE_MUTATION, {
        input: { accessToken },
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
    if (!IS_CONFIGURED) {
      toast.info('Demo mode: Password recovery is disabled')
      return
    }

    setLastError(null)
    type RecoverResponse = {
      data?: {
        customerRecover?: {
          userErrors?: ShopifyCustomerUserError[]
        }
      }
      errors?: unknown[]
    }
    
    const res = await shopifyFetch<RecoverResponse>(CUSTOMER_RECOVER_MUTATION, {
      input: { email },
    })
    
    const recoverResult = res.data?.customerRecover
    if (recoverResult?.userErrors && recoverResult.userErrors.length > 0) {
      setLastError(recoverResult.userErrors)
      throw new Error(recoverResult.userErrors[0].message)
    }
    // Shopify always returns success even if email doesn't exist (security measure)
  }, [])

  const resetPassword = useCallback(async (password: string, token: string, id: string) => {
    if (!IS_CONFIGURED) {
      toast.info('Demo mode: Password reset is disabled')
      return
    }

    setLastError(null)
    type ResetResponse = {
      data?: {
        customerReset?: {
          customerAccessToken?: ShopifyCustomerAccessToken
          userErrors?: ShopifyCustomerUserError[]
        }
      }
      errors?: unknown[]
    }
    
    const res = await shopifyFetch<ResetResponse>(CUSTOMER_RESET_MUTATION, {
      input: { password, id, token },
    })
    
    const resetResult = res.data?.customerReset
    if (resetResult?.userErrors && resetResult.userErrors.length > 0) {
      setLastError(resetResult.userErrors)
      throw new Error(resetResult.userErrors[0].message)
    }

    if (res.errors || !resetResult?.customerAccessToken) {
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
    if (!IS_CONFIGURED || !accessToken) return

    setLastError(null)
    type UpdateResponse = {
      data?: {
        customerUpdate?: {
          customer?: ShopifyCustomer
          customerUserErrors?: ShopifyCustomerUserError[]
        }
      }
      errors?: unknown[]
    }
    
    const res = await shopifyFetch<UpdateResponse>(CUSTOMER_UPDATE_MUTATION, {
      customerAccessToken: accessToken,
      input,
    })
    
    const updateResult = res.data?.customerUpdate
    if (updateResult?.customerUserErrors && updateResult.customerUserErrors.length > 0) {
      setLastError(updateResult.customerUserErrors)
      throw new Error(updateResult.customerUserErrors[0].message)
    }

    if (res.errors || !updateResult?.customer) {
      throw new Error('Profile update failed. Please try again.')
    }

    setCustomer(updateResult.customer)
  }, [accessToken])

  const refreshAccessToken = useCallback(async () => {
    const { recoveryToken } = getStoredToken()
    if (!recoveryToken) {
      throw new Error('No recovery token available')
    }
    await refreshStoredToken(recoveryToken)
  }, [refreshStoredToken])

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
  }

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  )
}
