import { useState, FormEvent } from 'react'
import { trackEvent } from '@/lib/analytics'

interface NewsletterSignupProps {
  className?: string
}

export function NewsletterSignup({ className }: NewsletterSignupProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    trackEvent('newsletter_signup', { email })

    // Placeholder — replace with your Shopify customer API or email service endpoint
    try {
      // await fetch('/api/newsletter', { method: 'POST', body: JSON.stringify({ email }) })
      await new Promise((r) => setTimeout(r, 800))
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
          className="text-sm tracking-[0.15em] text-center"
          style={{ color: 'oklch(0.60 0.11 78)' }}
        >
          Thank you for subscribing.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col items-center gap-3 ${className ?? ''}`}>
      <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground text-center">
        Get 10% off your first order
      </p>
      <div className="flex w-full max-w-sm gap-2">
        <input
          type="email"
          required
          placeholder="your@email.com"
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
          {status === 'loading' ? 'JOINING...' : 'SUBSCRIBE'}
        </button>
      </div>
      {status === 'error' && (
        <p className="text-xs text-red-400">Something went wrong. Please try again.</p>
      )}
    </form>
  )
}
