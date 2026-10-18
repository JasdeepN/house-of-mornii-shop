import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import { ErrorBoundary } from "react-error-boundary";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'
import { initGA4, initMetaPixel } from './lib/analytics'
import { followReducedMotion } from './lib/reduced-motion'

import './tailwind.css'
import './index.scss'

// Initialise analytics early so the first page-view event fires correctly.
followReducedMotion()
initGA4()
initMetaPixel()

// NOTE: Shopify credential validation happens in `./lib/shopify/client.ts`,
// which throws on module load (before this file runs) if
// VITE_SHOPIFY_STORE_DOMAIN / VITE_SHOPIFY_STOREFRONT_TOKEN are missing or
// placeholder values. This prevents a visually-healthy but
// commercially-dead storefront from being served in any environment.

// Remove the legacy browser-held Customer token once; the Customer session now lives on the server.
try {
  localStorage.removeItem('hom-customer-access-token')
  localStorage.removeItem('hom-customer-expires-at')
} catch {
  // Storage can be unavailable; nothing to clean up then.
}

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
      <MotionConfig reducedMotion="user">
        <App />
      </MotionConfig>
    </QueryClientProvider>
  </ErrorBoundary>
)
