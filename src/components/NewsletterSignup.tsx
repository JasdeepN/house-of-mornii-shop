import { useState, FormEvent } from 'react'
import { trackEvent } from '@/lib/analytics'
import { subscribeToNewsletter } from '@/lib/newsletter'
import { getNewsletterConfig } from '@/lib/siteConfig'

interface NewsletterSignupProps {
  className?: string
  source?: string
}

export function NewsletterSignup({ className, source = 'newsletter-form' }: NewsletterSignupProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const content = getNewsletterConfig()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus('loading')

    try {
      const result = await subscribeToNewsletter({ email, source })
      trackEvent('newsletter_signup', { source, mode: result.mode })
      setStatus('success')
      setEmail('')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className={className}>
        <p
          role="status"
          className="text-sm tracking-[0.15em] text-center"
          style={{ color: 'oklch(0.60 0.11 78)' }}
        >
          {content.successMessage}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col items-center gap-3 ${className ?? ''}`}>
      <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground text-center">
        {content.eyebrow}
      </p>
      <div className="flex w-full max-w-sm gap-2">
        <input
          type="email"
          required
          placeholder={content.placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 px-4 py-2.5 text-sm tracking-wider rounded-sm bg-transparent outline-none placeholder:text-muted-foreground/50"
          style={{
            border: '1px solid oklch(1 0 0 / 0.15)',
            color: 'oklch(0.90 0.01 210)',
          }}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="pill-btn pill-btn--cta px-5 py-2.5 text-xs whitespace-nowrap"
        >
          {status === 'loading' ? content.loadingLabel : content.ctaLabel}
        </button>
      </div>
      {status === 'error' && (
        <p className="text-xs text-red-400" role="alert">{content.errorMessage}</p>
      )}
    </form>
  )
}
