/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_NAME?: string
  readonly VITE_SITE_TITLE?: string
  readonly VITE_SITE_DESCRIPTION?: string
  readonly VITE_SITE_URL?: string
  readonly VITE_SITE_OG_IMAGE_PATH?: string
  readonly VITE_SITE_OG_IMAGE_ALT?: string
  readonly VITE_THEME_COLOR?: string
  readonly VITE_CONTACT_EMAIL?: string
  readonly VITE_INSTAGRAM_HANDLE?: string
  readonly VITE_INSTAGRAM_URL?: string
  readonly VITE_CONTACT_LOCATION_LABEL?: string
  readonly VITE_NEWSLETTER_ENDPOINT?: string
  readonly VITE_NEWSLETTER_EYEBROW?: string
  readonly VITE_NEWSLETTER_PLACEHOLDER?: string
  readonly VITE_NEWSLETTER_CTA?: string
  readonly VITE_NEWSLETTER_LOADING_LABEL?: string
  readonly VITE_NEWSLETTER_SUCCESS_MESSAGE?: string
  readonly VITE_NEWSLETTER_ERROR_MESSAGE?: string
  readonly VITE_WELCOME_POPUP_EYEBROW?: string
  readonly VITE_WELCOME_POPUP_TITLE?: string
  readonly VITE_WELCOME_POPUP_DESCRIPTION?: string
  readonly VITE_SHOPIFY_STORE_DOMAIN: string
  readonly VITE_SHOPIFY_STOREFRONT_TOKEN: string
  readonly VITE_GA4_MEASUREMENT_ID?: string
  readonly VITE_META_PIXEL_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
