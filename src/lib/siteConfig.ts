import { z } from 'zod'

const DEFAULT_SITE_NAME = 'House of Mornii'
const DEFAULT_DESCRIPTION = 'Regal costume jewellery embodying timeless luxury and modern artistry. Heritage-inspired pieces crafted to honor tradition while celebrating contemporary elegance.'

// ─── Environment Validation ───────────────────────────────────────────────────

const envSchema = z.object({
  VITE_SHOPIFY_STORE_DOMAIN: z.string().min(1, 'Shopify store domain is required'),
  VITE_SHOPIFY_STOREFRONT_TOKEN: z.string().min(1, 'Storefront token is required'),
  VITE_GA4_MEASUREMENT_ID: z.string().optional(),
  VITE_META_PIXEL_ID: z.string().optional(),
  VITE_SITE_NAME: z.string().min(1, 'Site name is required'),
  VITE_SITE_URL: z.string().url('Invalid URL format'),
  VITE_SITE_DESCRIPTION: z.string().min(1, 'Site description is required'),
  VITE_SITE_TITLE: z.string().optional(),
  VITE_SITE_OG_IMAGE_PATH: z.string().optional(),
  VITE_SITE_OG_IMAGE_ALT: z.string().optional(),
  VITE_CONTACT_EMAIL: z.string().optional(),
  VITE_INSTAGRAM_HANDLE: z.string().optional(),
  VITE_INSTAGRAM_URL: z.string().url('Invalid Instagram URL').optional(),
  VITE_NEWSLETTER_ENDPOINT: z.string().optional(),
  VITE_NEWSLETTER_EYEBROW: z.string().optional(),
  VITE_NEWSLETTER_PLACEHOLDER: z.string().optional(),
  VITE_NEWSLETTER_CTA: z.string().optional(),
  VITE_NEWSLETTER_LOADING_LABEL: z.string().optional(),
  VITE_NEWSLETTER_SUCCESS_MESSAGE: z.string().optional(),
  VITE_NEWSLETTER_ERROR_MESSAGE: z.string().optional(),
  VITE_WELCOME_POPUP_EYEBROW: z.string().optional(),
  VITE_WELCOME_POPUP_TITLE: z.string().optional(),
  VITE_WELCOME_POPUP_DESCRIPTION: z.string().optional(),
  VITE_CONTACT_LOCATION_LABEL: z.string().optional(),
})

// Validate environment variables at build time (skip in test mode)
const isTest = import.meta.env.VITEST === 'true' || import.meta.env.TEST === 'true'
if (!isTest) {
  try {
    envSchema.parse(import.meta.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Environment variable validation failed:', error.errors)
      throw new Error(`Invalid environment variables: ${error.errors.map(e => e.message).join(', ')}`)
    }
  }
}

function envValue(key: keyof ImportMetaEnv, fallback = '') {
  const value = import.meta.env[key]
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback
}

function currentOrigin() {
  return typeof window !== 'undefined' ? window.location.origin : ''
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

export function getSiteConfig() {
  const name = envValue('VITE_SITE_NAME', DEFAULT_SITE_NAME)
  const url = stripTrailingSlash(envValue('VITE_SITE_URL', currentOrigin()))
  const ogImagePath = envValue('VITE_SITE_OG_IMAGE_PATH', '/og-image.png')

  return {
    name,
    title: envValue('VITE_SITE_TITLE', name),
    description: envValue('VITE_SITE_DESCRIPTION', DEFAULT_DESCRIPTION),
    url,
    ogImagePath,
    ogImageAlt: envValue('VITE_SITE_OG_IMAGE_ALT', `${name} preview image`),
  }
}

export function absoluteSiteUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl

  const { url } = getSiteConfig()
  const normalizedPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
  return url ? `${url}${normalizedPath}` : normalizedPath
}

export function getContactConfig() {
  const email = envValue('VITE_CONTACT_EMAIL')
  const instagramHandle = envValue('VITE_INSTAGRAM_HANDLE')
  const instagramUrl = envValue('VITE_INSTAGRAM_URL')

  return {
    email,
    emailLabel: email || 'Contact email coming soon',
    emailHref: email ? `mailto:${email}` : undefined,
    instagramHandle,
    instagramUrl,
    locationLabel: envValue('VITE_CONTACT_LOCATION_LABEL', 'Appointment details coming soon'),
  }
}

export function getNewsletterConfig() {
  return {
    endpoint: envValue('VITE_NEWSLETTER_ENDPOINT'),
    eyebrow: envValue('VITE_NEWSLETTER_EYEBROW', 'Join the House of Mornii list'),
    placeholder: envValue('VITE_NEWSLETTER_PLACEHOLDER', 'your@email.com'),
    ctaLabel: envValue('VITE_NEWSLETTER_CTA', 'Join'),
    loadingLabel: envValue('VITE_NEWSLETTER_LOADING_LABEL', 'Joining...'),
    successMessage: envValue('VITE_NEWSLETTER_SUCCESS_MESSAGE', 'Thank you. We will share updates as the collection opens.'),
    errorMessage: envValue('VITE_NEWSLETTER_ERROR_MESSAGE', 'We could not save your email yet. Please try again.'),
  }
}

export function getWelcomePopupConfig() {
  return {
    eyebrow: envValue('VITE_WELCOME_POPUP_EYEBROW', 'Welcome'),
    title: envValue('VITE_WELCOME_POPUP_TITLE', getSiteConfig().name),
    description: envValue('VITE_WELCOME_POPUP_DESCRIPTION', 'Join the list for collection previews and launch updates.'),
  }
}