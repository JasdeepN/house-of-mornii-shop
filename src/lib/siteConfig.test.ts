import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('siteConfig', () => {
  const originalEnv: Record<string, string | undefined> = {}

  beforeEach(() => {
    // Save original env values
    const envKeys = [
      'VITE_SITE_NAME',
      'VITE_SITE_URL',
      'VITE_SITE_DESCRIPTION',
      'VITE_SITE_TITLE',
      'VITE_SITE_OG_IMAGE_PATH',
      'VITE_SITE_OG_IMAGE_ALT',
      'VITE_CONTACT_EMAIL',
      'VITE_CONTACT_LOCATION_LABEL',
      'VITE_INSTAGRAM_HANDLE',
      'VITE_INSTAGRAM_URL',
      'VITE_NEWSLETTER_ENDPOINT',
      'VITE_NEWSLETTER_EYEBROW',
      'VITE_NEWSLETTER_PLACEHOLDER',
      'VITE_NEWSLETTER_CTA',
      'VITE_NEWSLETTER_LOADING_LABEL',
      'VITE_NEWSLETTER_SUCCESS_MESSAGE',
      'VITE_NEWSLETTER_ERROR_MESSAGE',
      'VITE_WELCOME_POPUP_EYEBROW',
      'VITE_WELCOME_POPUP_TITLE',
      'VITE_WELCOME_POPUP_DESCRIPTION',
      'VITE_WELCOME_POPUP_ENABLED',
    ]
    for (const key of envKeys) {
      originalEnv[key] = import.meta.env[key]
    }
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // Restore original env values
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value !== undefined) {
        vi.stubEnv(key, value)
      }
    }
  })

  describe('getSiteConfig', () => {
    it('returns default site name when VITE_SITE_NAME is not set', async () => {
      vi.stubEnv('VITE_SITE_NAME', '')
      vi.stubEnv('VITE_SITE_URL', 'https://example.com')
      vi.stubEnv('VITE_SITE_DESCRIPTION', 'Test description')

      const { getSiteConfig } = await import('./siteConfig')
      const config = getSiteConfig()

      expect(config.name).toBe('House of Mornii')
    })

    it('returns custom site name when VITE_SITE_NAME is set', async () => {
      vi.stubEnv('VITE_SITE_NAME', 'My Custom Shop')
      vi.stubEnv('VITE_SITE_URL', 'https://example.com')
      vi.stubEnv('VITE_SITE_DESCRIPTION', 'Test description')

      const { getSiteConfig } = await import('./siteConfig')
      const config = getSiteConfig()

      expect(config.name).toBe('My Custom Shop')
    })

    it('returns title falling back to name when VITE_SITE_TITLE is not set', async () => {
      vi.stubEnv('VITE_SITE_NAME', 'My Shop')
      vi.stubEnv('VITE_SITE_URL', 'https://example.com')
      vi.stubEnv('VITE_SITE_DESCRIPTION', 'Test description')

      const { getSiteConfig } = await import('./siteConfig')
      const config = getSiteConfig()

      expect(config.title).toBe('My Shop')
    })

    it('returns custom title when VITE_SITE_TITLE is set', async () => {
      vi.stubEnv('VITE_SITE_NAME', 'My Shop')
      vi.stubEnv('VITE_SITE_TITLE', 'Custom Title')
      vi.stubEnv('VITE_SITE_URL', 'https://example.com')
      vi.stubEnv('VITE_SITE_DESCRIPTION', 'Test description')

      const { getSiteConfig } = await import('./siteConfig')
      const config = getSiteConfig()

      expect(config.title).toBe('Custom Title')
    })

    it('returns default description when VITE_SITE_DESCRIPTION is not set', async () => {
      vi.stubEnv('VITE_SITE_NAME', 'My Shop')
      vi.stubEnv('VITE_SITE_URL', 'https://example.com')
      vi.stubEnv('VITE_SITE_DESCRIPTION', '')

      const { getSiteConfig } = await import('./siteConfig')
      const config = getSiteConfig()

      expect(config.description).toContain('Regal costume jewellery')
    })

    it('returns URL with trailing slash stripped', async () => {
      vi.stubEnv('VITE_SITE_NAME', 'My Shop')
      vi.stubEnv('VITE_SITE_URL', 'https://example.com/')
      vi.stubEnv('VITE_SITE_DESCRIPTION', 'Test description')

      const { getSiteConfig } = await import('./siteConfig')
      const config = getSiteConfig()

      expect(config.url).toBe('https://example.com')
    })

    it('returns default ogImagePath when VITE_SITE_OG_IMAGE_PATH is not set', async () => {
      vi.stubEnv('VITE_SITE_NAME', 'My Shop')
      vi.stubEnv('VITE_SITE_URL', 'https://example.com')
      vi.stubEnv('VITE_SITE_DESCRIPTION', 'Test description')

      const { getSiteConfig } = await import('./siteConfig')
      const config = getSiteConfig()

      expect(config.ogImagePath).toBe('/og-image.png')
    })

    it('returns default ogImageAlt when VITE_SITE_OG_IMAGE_ALT is not set', async () => {
      vi.stubEnv('VITE_SITE_NAME', 'My Shop')
      vi.stubEnv('VITE_SITE_URL', 'https://example.com')
      vi.stubEnv('VITE_SITE_DESCRIPTION', 'Test description')

      const { getSiteConfig } = await import('./siteConfig')
      const config = getSiteConfig()

      expect(config.ogImageAlt).toBe('My Shop preview image')
    })
  })

  describe('absoluteSiteUrl', () => {
    it('returns the URL as-is for absolute URLs', async () => {
      vi.stubEnv('VITE_SITE_NAME', 'My Shop')
      vi.stubEnv('VITE_SITE_URL', 'https://example.com')
      vi.stubEnv('VITE_SITE_DESCRIPTION', 'Test description')

      const { absoluteSiteUrl } = await import('./siteConfig')

      expect(absoluteSiteUrl('https://external.com/page')).toBe('https://external.com/page')
      expect(absoluteSiteUrl('http://external.com/page')).toBe('http://external.com/page')
    })

    it('prepends site URL for relative paths starting with /', async () => {
      vi.stubEnv('VITE_SITE_NAME', 'My Shop')
      vi.stubEnv('VITE_SITE_URL', 'https://example.com')
      vi.stubEnv('VITE_SITE_DESCRIPTION', 'Test description')

      const { absoluteSiteUrl } = await import('./siteConfig')

      expect(absoluteSiteUrl('/products')).toBe('https://example.com/products')
    })

    it('prepends / for relative paths not starting with /', async () => {
      vi.stubEnv('VITE_SITE_NAME', 'My Shop')
      vi.stubEnv('VITE_SITE_URL', 'https://example.com')
      vi.stubEnv('VITE_SITE_DESCRIPTION', 'Test description')

      const { absoluteSiteUrl } = await import('./siteConfig')

      expect(absoluteSiteUrl('products')).toBe('https://example.com/products')
    })

    it('falls back to the current window origin when site URL is empty', async () => {
      vi.stubEnv('VITE_SITE_NAME', 'My Shop')
      vi.stubEnv('VITE_SITE_URL', '')
      vi.stubEnv('VITE_SITE_DESCRIPTION', 'Test description')

      const { absoluteSiteUrl } = await import('./siteConfig')

      expect(absoluteSiteUrl('/products')).toBe(`${window.location.origin}/products`)
    })

    it('returns just the path when site URL is empty and there is no window', async () => {
      vi.stubEnv('VITE_SITE_NAME', 'My Shop')
      vi.stubEnv('VITE_SITE_URL', '')
      vi.stubEnv('VITE_SITE_DESCRIPTION', 'Test description')
      vi.stubGlobal('window', undefined)

      try {
        const { absoluteSiteUrl } = await import('./siteConfig')
        expect(absoluteSiteUrl('/products')).toBe('/products')
      } finally {
        vi.unstubAllGlobals()
      }
    })
  })

  describe('getContactConfig', () => {
    it('defaults to contact@houseofmornii.com when VITE_CONTACT_EMAIL is not set', async () => {
      vi.stubEnv('VITE_CONTACT_EMAIL', '')

      const { getContactConfig } = await import('./siteConfig')
      const config = getContactConfig()

      expect(config.email).toBe('contact@houseofmornii.com')
      expect(config.emailLabel).toBe('contact@houseofmornii.com')
      expect(config.emailHref).toBe('mailto:contact@houseofmornii.com')
    })

    it('returns email and mailto href when VITE_CONTACT_EMAIL is set', async () => {
      vi.stubEnv('VITE_CONTACT_EMAIL', 'test@example.com')

      const { getContactConfig } = await import('./siteConfig')
      const config = getContactConfig()

      expect(config.email).toBe('test@example.com')
      expect(config.emailLabel).toBe('test@example.com')
      expect(config.emailHref).toBe('mailto:test@example.com')
    })

    it('returns instagram handle and URL when set', async () => {
      vi.stubEnv('VITE_INSTAGRAM_HANDLE', 'houseofmornii')
      vi.stubEnv('VITE_INSTAGRAM_URL', 'https://instagram.com/houseofmornii')

      const { getContactConfig } = await import('./siteConfig')
      const config = getContactConfig()

      expect(config.instagramHandle).toBe('houseofmornii')
      expect(config.instagramUrl).toBe('https://instagram.com/houseofmornii')
    })

    it('returns no location label when VITE_CONTACT_LOCATION_LABEL is not set', async () => {
      vi.stubEnv('VITE_CONTACT_LOCATION_LABEL', '')

      const { getContactConfig } = await import('./siteConfig')
      const config = getContactConfig()

      expect(config.locationLabel).toBe('')
    })

    it('returns custom location label when VITE_CONTACT_LOCATION_LABEL is set', async () => {
      vi.stubEnv('VITE_CONTACT_LOCATION_LABEL', 'By appointment only')

      const { getContactConfig } = await import('./siteConfig')
      const config = getContactConfig()

      expect(config.locationLabel).toBe('By appointment only')
    })
  })

  describe('getNewsletterConfig', () => {
    it('returns default values when no env vars are set', async () => {
      vi.stubEnv('VITE_NEWSLETTER_ENDPOINT', '')
      vi.stubEnv('VITE_NEWSLETTER_EYEBROW', '')
      vi.stubEnv('VITE_NEWSLETTER_PLACEHOLDER', '')
      vi.stubEnv('VITE_NEWSLETTER_CTA', '')
      vi.stubEnv('VITE_NEWSLETTER_LOADING_LABEL', '')
      vi.stubEnv('VITE_NEWSLETTER_SUCCESS_MESSAGE', '')
      vi.stubEnv('VITE_NEWSLETTER_ERROR_MESSAGE', '')

      const { getNewsletterConfig } = await import('./siteConfig')
      const config = getNewsletterConfig()

      expect(config.endpoint).toBe('')
      expect(config.eyebrow).toBe('Join the House of Mornii list')
      expect(config.placeholder).toBe('your@email.com')
      expect(config.ctaLabel).toBe('Join')
      expect(config.loadingLabel).toBe('Joining...')
      expect(config.successMessage).toContain('Thank you')
      expect(config.errorMessage).toContain('could not save')
    })

    it('returns custom values when env vars are set', async () => {
      vi.stubEnv('VITE_NEWSLETTER_ENDPOINT', 'https://api.example.com/subscribe')
      vi.stubEnv('VITE_NEWSLETTER_EYEBROW', 'Join our list')
      vi.stubEnv('VITE_NEWSLETTER_PLACEHOLDER', 'Enter your email')
      vi.stubEnv('VITE_NEWSLETTER_CTA', 'Subscribe')
      vi.stubEnv('VITE_NEWSLETTER_LOADING_LABEL', 'Subscribing...')
      vi.stubEnv('VITE_NEWSLETTER_SUCCESS_MESSAGE', 'Welcome aboard!')
      vi.stubEnv('VITE_NEWSLETTER_ERROR_MESSAGE', 'Please try again later.')

      const { getNewsletterConfig } = await import('./siteConfig')
      const config = getNewsletterConfig()

      expect(config.endpoint).toBe('https://api.example.com/subscribe')
      expect(config.eyebrow).toBe('Join our list')
      expect(config.placeholder).toBe('Enter your email')
      expect(config.ctaLabel).toBe('Subscribe')
      expect(config.loadingLabel).toBe('Subscribing...')
      expect(config.successMessage).toBe('Welcome aboard!')
      expect(config.errorMessage).toBe('Please try again later.')
    })
  })

  describe('getWelcomePopupConfig', () => {
    it('returns default values when no env vars are set', async () => {
      vi.stubEnv('VITE_WELCOME_POPUP_EYEBROW', '')
      vi.stubEnv('VITE_WELCOME_POPUP_TITLE', '')
      vi.stubEnv('VITE_WELCOME_POPUP_DESCRIPTION', '')
      vi.stubEnv('VITE_SITE_NAME', 'My Shop')
      vi.stubEnv('VITE_SITE_URL', 'https://example.com')
      vi.stubEnv('VITE_SITE_DESCRIPTION', 'Test description')

      const { getWelcomePopupConfig } = await import('./siteConfig')
      const config = getWelcomePopupConfig()

      expect(config.eyebrow).toBe('Welcome')
      expect(config.title).toBe('My Shop')
      expect(config.description).toBe('Join the list for collection previews and launch updates.')
    })

    it('returns custom values when env vars are set', async () => {
      vi.stubEnv('VITE_WELCOME_POPUP_EYEBROW', 'Welcome, friend')
      vi.stubEnv('VITE_WELCOME_POPUP_TITLE', 'Join the Collection')
      vi.stubEnv('VITE_WELCOME_POPUP_DESCRIPTION', 'Be the first to know.')
      vi.stubEnv('VITE_SITE_NAME', 'My Shop')
      vi.stubEnv('VITE_SITE_URL', 'https://example.com')
      vi.stubEnv('VITE_SITE_DESCRIPTION', 'Test description')

      const { getWelcomePopupConfig } = await import('./siteConfig')
      const config = getWelcomePopupConfig()

      expect(config.eyebrow).toBe('Welcome, friend')
      expect(config.title).toBe('Join the Collection')
      expect(config.description).toBe('Be the first to know.')
    })

    it('falls back to site name for title when VITE_WELCOME_POPUP_TITLE is not set', async () => {
      vi.stubEnv('VITE_WELCOME_POPUP_TITLE', '')
      vi.stubEnv('VITE_SITE_NAME', 'Custom Shop Name')
      vi.stubEnv('VITE_SITE_URL', 'https://example.com')
      vi.stubEnv('VITE_SITE_DESCRIPTION', 'Test description')

      const { getWelcomePopupConfig } = await import('./siteConfig')
      const config = getWelcomePopupConfig()

      expect(config.title).toBe('Custom Shop Name')
    })

    it('is switched off unless VITE_WELCOME_POPUP_ENABLED is "true"', async () => {
      vi.stubEnv('VITE_WELCOME_POPUP_ENABLED', '')
      const { getWelcomePopupConfig } = await import('./siteConfig')

      expect(getWelcomePopupConfig().enabled).toBe(false)

      vi.stubEnv('VITE_WELCOME_POPUP_ENABLED', 'yes')
      expect(getWelcomePopupConfig().enabled).toBe(false)
    })

    it('is switched on when VITE_WELCOME_POPUP_ENABLED is "true"', async () => {
      vi.stubEnv('VITE_WELCOME_POPUP_ENABLED', 'true')
      const { getWelcomePopupConfig } = await import('./siteConfig')

      expect(getWelcomePopupConfig().enabled).toBe(true)
    })
  })
})


describe('getNewsletterConfig().enabled', () => {
  it('is off by default and on only for "true"', async () => {
    const { getNewsletterConfig } = await import('./siteConfig')
    vi.stubEnv('VITE_NEWSLETTER_ENABLED', '')
    expect(getNewsletterConfig().enabled).toBe(false)
    vi.stubEnv('VITE_NEWSLETTER_ENABLED', 'true')
    expect(getNewsletterConfig().enabled).toBe(true)
  })
})
