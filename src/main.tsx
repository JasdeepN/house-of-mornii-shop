import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'
import { initGA4, initMetaPixel } from './lib/analytics'

import './tailwind.css'
import './index.scss'

// Initialise analytics early so the first page-view event fires correctly.
initGA4()
initMetaPixel()

// NOTE: Shopify credential validation happens in `./lib/shopify/client.ts`,
// which throws on module load (before this file runs) if
// VITE_SHOPIFY_STORE_DOMAIN / VITE_SHOPIFY_STOREFRONT_TOKEN are missing or
// placeholder values. This prevents a visually-healthy but
// commercially-dead storefront from being served in any environment.

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </ErrorBoundary>
)
