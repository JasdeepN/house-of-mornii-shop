import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { SignedOutError } from './errors'
import type { CustomerIdentity, CustomerSession } from './types'

interface CustomerSessionContextValue {
  session: CustomerSession
  signIn: (email?: string) => void
  signOut: () => void
}

const CustomerSessionContext = createContext<CustomerSessionContextValue | null>(null)

function signIn(email?: string): void {
  const returnTo = encodeURIComponent(window.location.pathname + window.location.search)
  const hint = email ? '&login_hint=' + encodeURIComponent(email) : ''
  window.location.assign('/api/customer/sign-in?return_to=' + returnTo + hint)
}

function signOut(): void {
  const form = document.createElement('form')
  form.method = 'post'
  form.action = '/api/customer/sign-out'
  form.hidden = true
  document.body.appendChild(form)
  form.submit()
}

async function loadSession(): Promise<CustomerSession> {
  try {
    const response = await fetch('/api/customer/session', { credentials: 'same-origin' })
    if (response.status === 401 || !response.ok) return { status: 'signed-out' }
    // The customer-session Worker answers { signedIn: true, customer: { id, name, email } }.
    const body = (await response.json()) as { customer?: CustomerIdentity }
    const customer = body.customer ?? null
    if (!customer) return { status: 'signed-out' }
    return {
      status: 'signed-in',
      customer: { id: customer.id, name: customer.name, email: customer.email },
    }
  } catch {
    // A network error must not throw; the Customer simply appears signed out.
    return { status: 'signed-out' }
  }
}

export function CustomerSessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<CustomerSession>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    void loadSession().then((next) => {
      if (!cancelled) setSession((prev) => (prev.status === 'loading' ? next : prev))
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Any SignedOutError from a query or mutation lands in the QueryClient's caches, so listening
  // there catches every hook without each one reporting back to the provider.
  useEffect(() => {
    const onEvent = (event: { type: string; action?: { type: string; error?: unknown } }) => {
      if (event.type === 'updated' && event.action?.type === 'error' && event.action.error instanceof SignedOutError) {
        setSession({ status: 'signed-out' })
      }
    }
    const unsubQueries = queryClient.getQueryCache().subscribe(onEvent)
    const unsubMutations = queryClient.getMutationCache().subscribe(onEvent)
    return () => {
      unsubQueries()
      unsubMutations()
    }
  }, [queryClient])

  const value = useMemo(() => ({ session, signIn, signOut }), [session])
  return <CustomerSessionContext.Provider value={value}>{children}</CustomerSessionContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCustomerSession(): CustomerSessionContextValue {
  const ctx = useContext(CustomerSessionContext)
  if (!ctx) throw new Error('useCustomerSession must be used within CustomerSessionProvider')
  return ctx
}
