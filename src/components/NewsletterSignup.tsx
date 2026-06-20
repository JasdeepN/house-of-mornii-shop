import { useState, FormEvent } from 'react'
import { trackEvent } from '@/lib/analytics'
import { subscribeToNewsletter } from '@/lib/newsletter'
import { getNewsletterConfig } from '@/lib/siteConfig'

// ─── Email Validation ─────────────────────────────────────────────────────────

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const isValidEmail = (email: string): boolean => {
  return emailRegex.test(email.trim().toLowerCase())
}

const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase()
}

interface NewsletterSignupProps {
  className?: string
  source?: string
}

interface EmailState {
  value: string
  isValid: boolean
  error: string | null
}

export function NewsletterSignup({ className, source = 'newsletter-form' }: NewsletterSignupProps) {
  const [email, setEmail] = useState<EmailState>({
    value: '',
    isValid: false,
    error: null
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const content = getNewsletterConfig()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    const sanitizedEmail = sanitizeEmail(email.value)
    if (!sanitizedEmail) {
      setEmail(prev => ({ ...prev, error: 'Email is required', isValid: false }))
      setStatus('error')
      return
    }
    
    if (!isValidEmail(sanitizedEmail)) {
      setEmail(prev => ({ ...prev, error: 'Invalid email format', isValid: false }))
      setStatus('error')
      return
    }

    setStatus('loading')

    try {
      const result = await subscribeToNewsletter({ email: sanitizedEmail, source })
      trackEvent('newsletter_signup', { source, mode: result.mode })
      setStatus('success')
      setEmail({ value: '', isValid: false, error: null })
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
          value={email.value}
          onChange={(e) => {
            const value = e.target.value
            setEmail({
              value,
              isValid: isValidEmail(value),
              error: null
            })
          }}
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
        <p 
          className="text-xs text-red-400" 
          role="alert"
          aria-live="polite"
        >
          {email.isValid ? content.errorMessage : 'Please enter a valid email address'}
        </p>
      )}
    </form>
  )
}
