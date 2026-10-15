import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// Production build guard: fail loudly if demo mode is detected.
// Dev builds (DEPLOY_ENV=dev) skip the strict credential check so they can
// use placeholder/demo credentials without aborting the CI pipeline.
const isDevDeploy = process.env.DEPLOY_ENV === 'dev'

if (process.env.NODE_ENV === 'production' && !isDevDeploy) {
  const domain = process.env.VITE_SHOPIFY_STORE_DOMAIN
  const token = process.env.VITE_SHOPIFY_STOREFRONT_TOKEN

  if (!domain || !token) {
    console.error(
      '[BUILD ERROR] Production build requires Shopify credentials.\n' +
      'Set VITE_SHOPIFY_STORE_DOMAIN and VITE_SHOPIFY_STOREFRONT_TOKEN.\n' +
      'Aborting production build to prevent silent demo mode deployment.'
    )
    process.exit(1)
  }

  // Check for placeholder values
  const PLACEHOLDER_DOMAINS = ['your-store.myshopify.com', 'CHANGE_ME']
  if (PLACEHOLDER_DOMAINS.some(d => domain.includes(d))) {
    console.error(
      '[BUILD ERROR] Production build blocked: Placeholder domain detected.\n' +
      `Domain: ${domain}\n` +
      'Please configure a valid Shopify store domain.'
    )
    process.exit(1)
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
  server: {
    watch: {
      usePolling: true,
    },
    hmr: {
      overlay: true,
    },
    // Proxy Admin API calls to Cloudflare Worker during local development
    proxy: {
      '/api/shopify': {
        target: 'http://localhost:8787', // Cloudflare dev server (wrangler dev)
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/shopify/, ''),
      },
    },
  },
  build: {
    // Split vendor bundle into smaller chunks for better caching and parallel loading
    rollupOptions: {
      output: {
        manualChunks: {
          // React ecosystem — core framework, always needed
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Shopify data fetching — TanStack Query + Shopify SDK
          'shopify-vendor': ['@tanstack/react-query', '@shopify/storefront-api-client'],
          // UI components — Radix UI primitives (28 packages)
          'radix-ui': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-aspect-ratio',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-context-menu',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-hover-card',
            '@radix-ui/react-label',
            '@radix-ui/react-menubar',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slider',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toggle',
            '@radix-ui/react-toggle-group',
            '@radix-ui/react-tooltip',
          ],
          // Animation library — Framer Motion (heavy, ~80-100 kB)
          'framer-motion': ['framer-motion'],
          // Icons — multiple icon libraries
          'icons': ['@phosphor-icons/react', 'lucide-react', '@heroicons/react'],
          // Utilities — form handling, date formatting, sanitization
          'utils': ['react-hook-form', '@hookform/resolvers', 'date-fns', 'dompurify', 'zod', 'uuid'],
          // UI enhancements — toasts, carousels, resizable panels
          'ui-enhancements': ['sonner', 'embla-carousel-react', 'react-resizable-panels', 'vaul'],
        },
      },
    },
    // Reduce chunk size warning threshold to catch issues earlier
    chunkSizeWarningLimit: 200,
  },
});
