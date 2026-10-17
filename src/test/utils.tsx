import { render, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { CartProvider } from '@/context/CartContext'
import { CustomerSessionProvider } from '@/lib/customer'
import { SignInDialogProvider } from '@/context/SignInDialogContext'
import { vi } from 'vitest'
import type { ReactElement, ReactNode } from 'react'

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

interface WrapperProps {
  children: ReactNode
}

export type TestSession =
  | 'loading'
  | 'signed-out'
  | { id: string; name: string; email: string }

/**
 * Stubs global fetch so `/api/customer/session` answers as the given session; other URLs
 * reject. 'loading' never resolves. Called only when a test passes the `session` option.
 */
function stubCustomerSession(session: TestSession) {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      if (!url.includes('/api/customer/session')) return Promise.reject(new Error('unmocked fetch: ' + url))
      if (session === 'loading') return new Promise<Response>(() => {})
      if (session === 'signed-out') return Promise.resolve(new Response('{}', { status: 401 }))
      return Promise.resolve(
        new Response(JSON.stringify({ signedIn: true, customer: session }), { status: 200 }),
      )
    }),
  )
}

/**
 * Custom render that wraps the component with all necessary providers:
 * MemoryRouter + QueryClientProvider + CustomerSessionProvider + SignInDialogProvider + CartProvider.
 * Pass `session` to set the Customer session state (stubs fetch('/api/customer/session')).
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    initialEntries = ['/'],
    session,
    ...options
  }: RenderOptions & { initialEntries?: string[]; session?: TestSession } = {},
) {
  const queryClient = createTestQueryClient()
  if (session) stubCustomerSession(session)

  function Wrapper({ children }: WrapperProps) {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        <QueryClientProvider client={queryClient}>
          <CustomerSessionProvider>
            <SignInDialogProvider>
              <CartProvider>{children}</CartProvider>
            </SignInDialogProvider>
          </CustomerSessionProvider>
        </QueryClientProvider>
      </MemoryRouter>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    queryClient,
  }
}

/**
 * Lightweight render with just MemoryRouter + QueryClient (no CartProvider).
 */
export function renderWithRouter(
  ui: ReactElement,
  {
    initialEntries = ['/'],
    ...options
  }: RenderOptions & { initialEntries?: string[] } = {},
) {
  const queryClient = createTestQueryClient()

  function Wrapper({ children }: WrapperProps) {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </MemoryRouter>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    queryClient,
  }
}

export { default as userEvent } from '@testing-library/user-event'
