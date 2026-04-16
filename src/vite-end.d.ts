/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHOPIFY_STORE_DOMAIN: string
  readonly VITE_SHOPIFY_STOREFRONT_TOKEN: string
  readonly VITE_GA4_MEASUREMENT_ID?: string
  readonly VITE_META_PIXEL_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
