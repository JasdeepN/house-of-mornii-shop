import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'
import { CartProvider } from './context/CartContext'
import { STOREFRONT_MODE } from './lib/shopify/client'
import { initGA4, initMetaPixel } from './lib/analytics'

import './tailwind.css'
import './index.scss'

// Initialise analytics early so the first page-view event fires correctly.
initGA4()
initMetaPixel()

// In production, demo mode means Shopify credentials are absent.
// Fail loudly rather than ship a visually-healthy but commercially-dead storefront.
if (import.meta.env.PROD && STOREFRONT_MODE === 'demo') {
  document.getElementById('root')!.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;background:#0d0d14;color:#f0ede8;gap:1rem;padding:2rem;text-align:center;">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <h1 style="font-size:1.5rem;font-weight:600;margin:0;">Storefront Not Configured</h1>
      <p style="max-width:420px;opacity:.7;margin:0;">Shopify credentials are missing from this deployment. Set <code>VITE_SHOPIFY_STORE_DOMAIN</code> and <code>VITE_SHOPIFY_STOREFRONT_TOKEN</code> to go live.</p>
    </div>
  `
  throw new Error('[House of Mornii] Production build is missing required Shopify credentials. Set VITE_SHOPIFY_STORE_DOMAIN and VITE_SHOPIFY_STOREFRONT_TOKEN.')
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
      <CartProvider>
        <App />
      </CartProvider>
    </QueryClientProvider>
  </ErrorBoundary>
)
