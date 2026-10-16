import { vi } from 'vitest'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CustomerSessionProvider } from './session'

export function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <CustomerSessionProvider>{children}</CustomerSessionProvider>
    </QueryClientProvider>
  )
  return { queryClient, Wrapper }
}

export function stubSession(status: 'in' | 'out' | 'network-error') {
  const fn = status === 'network-error'
    ? vi.fn().mockRejectedValue(new TypeError('network'))
    : vi.fn().mockResolvedValue(
        status === 'in'
          ? { ok: true, status: 200, json: async () => ({ customer: { id: 'gid://c/1', name: 'Ada Lovelace', email: 'ada@example.com' } }) }
          : { ok: false, status: 401, json: async () => ({}) },
      )
  vi.stubGlobal('fetch', fn)
  return fn
}
