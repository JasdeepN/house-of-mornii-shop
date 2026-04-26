const DEFAULT_SITE_NAME = 'House of Mornii'
const DEFAULT_DESCRIPTION = 'Regal costume jewellery embodying timeless luxury and modern artistry. Heritage-inspired pieces crafted to honor tradition while celebrating contemporary elegance.'

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