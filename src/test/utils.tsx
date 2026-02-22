import { render, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { CartProvider } from '@/context/CartContext'
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

/**
 * Custom render that wraps the component with all necessary providers:
 * MemoryRouter + QueryClientProvider + CartProvider
 */
export function renderWithProviders(
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
          <CartProvider>{children}</CartProvider>
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
