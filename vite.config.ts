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
});
