import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { getEnquiryConfig } from '@/lib/siteConfig'
import { cn } from '@/lib/utils'

const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
/** The normal widget is a fixed 300px wide; narrower spaces get the 150px compact one. */
const TURNSTILE_NORMAL_WIDTH = 300

interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string
      size?: 'normal' | 'compact' | 'flexible'
      callback: (token: string) => void
      'expired-callback'?: () => void
      'error-callback'?: () => void
    },
  ) => string
  reset: (widgetId?: string) => void
  remove: (widgetId?: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

let scriptPromise: Promise<TurnstileApi> | undefined

/** Loads the Turnstile script once and resolves with its API. */
function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = TURNSTILE_SCRIPT
    script.async = true
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile missing')))
    script.onerror = () => {
      scriptPromise = undefined
      script.remove()
      reject(new Error('Turnstile failed to load'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

export interface EnquiryProduct {
  title: string
  url: string
  variant?: string
}

export interface EnquiryFormProps {
  kind: 'product' | 'styling'
  product?: EnquiryProduct
  className?: string
}

type Field = 'name' | 'email' | 'phone' | 'message'
type Errors = Partial<Record<Field, string>>
type Status = 'idle' | 'sending' | 'sent' | 'rate_limited' | 'failed'

const FIELD_ORDER: Field[] = ['name', 'email', 'phone', 'message']
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateEnquiry(values: Record<Field, string>): Errors {
  const errors: Errors = {}
  const name = values.name.trim()
  const message = values.message.trim()
  if (!name) errors.name = 'Please tell us your name.'
  else if (name.length > 100) errors.name = 'Please keep your name to 100 characters.'
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Please enter a valid email address.'
  if (values.phone.trim().length > 30) errors.phone = 'Please keep your phone number to 30 characters.'
  if (message.length < 10) errors.message = 'Please write at least 10 characters.'
  else if (message.length > 2000) errors.message = 'Please keep your message to 2000 characters.'
  return errors
}

const inputClass = 'h-11 bg-card text-foreground'

export function EnquiryForm({ kind, product, className }: EnquiryFormProps) {
  const config = getEnquiryConfig()
  const baseId = useId()
  const widgetRef = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | undefined>(undefined)
  const token = useRef('')
  const formRef = useRef<HTMLFormElement>(null)
  const [values, setValues] = useState<Record<Field, string>>({ name: '', email: '', phone: '', message: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<Status>('idle')
  const [securityError, setSecurityError] = useState(false)

  const siteKey = config.turnstileSiteKey

  useEffect(() => {
    if (!siteKey || status === 'sent') return
    let cancelled = false
    loadTurnstile()
      .then((api) => {
        if (cancelled || !widgetRef.current) return
        widgetId.current = api.render(widgetRef.current, {
          sitekey: siteKey,
          size: widgetRef.current.clientWidth < TURNSTILE_NORMAL_WIDTH ? 'compact' : 'normal',
          callback: (t) => {
            token.current = t
            setSecurityError(false)
          },
          'expired-callback': () => {
            token.current = ''
          },
          'error-callback': () => {
            token.current = ''
          },
        })
      })
      .catch(() => {
        if (!cancelled) setStatus('failed')
      })
    return () => {
      cancelled = true
      if (widgetId.current !== undefined) window.turnstile?.remove(widgetId.current)
      widgetId.current = undefined
      token.current = ''
    }
  }, [siteKey, status === 'sent']) // eslint-disable-line react-hooks/exhaustive-deps

  const resetToken = useCallback(() => {
    token.current = ''
    if (widgetId.current !== undefined) window.turnstile?.reset(widgetId.current)
  }, [])

  if (!config.enabled) return null

  const focusField = (field: Field) => {
    formRef.current?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus()
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (status === 'sending') return

    const found = validateEnquiry(values)
    setErrors(found)
    const firstInvalid = FIELD_ORDER.find((f) => found[f])
    if (firstInvalid) {
      focusField(firstInvalid)
      return
    }
    if (!token.current) {
      setSecurityError(true)
      return
    }

    setStatus('sending')
    setSecurityError(false)
    const body = {
      kind,
      name: values.name.trim(),
      email: values.email.trim(),
      ...(values.phone.trim() ? { phone: values.phone.trim() } : {}),
      message: values.message.trim(),
      ...(kind === 'product' && product ? { product } : {}),
      turnstileToken: token.current,
    }

    try {
      const res = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setStatus('sent')
        return
      }
      if (res.status === 400) {
        const data = (await res.json().catch(() => null)) as { fields?: Errors } | null
        const fields = data?.fields
        if (fields && Object.keys(fields).length > 0) {
          setErrors(fields)
          setStatus('idle')
          const first = FIELD_ORDER.find((f) => fields[f])
          if (first) focusField(first)
          return
        }
      }
      setStatus(res.status === 429 ? 'rate_limited' : 'failed')
    } catch {
      setStatus('failed')
    } finally {
      resetToken()
    }
  }

  if (status === 'sent') {
    return (
      <div className={className}>
        <p role="status" className="text-base leading-relaxed text-foreground">
          Thank you, we&apos;ve received your message and will reply by email.
        </p>
      </div>
    )
  }

  const update = (field: Field) => (value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const fieldProps = (field: Field) => ({
    id: `${baseId}-${field}`,
    name: field,
    value: values[field],
    onChange: (e: { target: { value: string } }) => update(field)(e.target.value),
    'aria-invalid': errors[field] ? true : undefined,
    'aria-describedby': errors[field] ? `${baseId}-${field}-error` : undefined,
  })

  const labelClass = 'text-xs tracking-[0.15em] uppercase text-foreground min-h-6'
  const errorText = (field: Field) =>
    errors[field] ? (
      <p id={`${baseId}-${field}-error`} className="text-sm text-destructive [overflow-wrap:anywhere]">
        {errors[field]}
      </p>
    ) : null

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className={cn('flex flex-col gap-5 text-left', className)}>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${baseId}-name`} className={labelClass}>Name</Label>
        <Input {...fieldProps('name')} type="text" autoComplete="name" required className={inputClass} />
        {errorText('name')}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${baseId}-email`} className={labelClass}>Email</Label>
        <Input {...fieldProps('email')} type="email" autoComplete="email" required className={inputClass} />
        {errorText('email')}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${baseId}-phone`} className={labelClass}>Phone (optional)</Label>
        <Input {...fieldProps('phone')} type="tel" autoComplete="tel" className={inputClass} />
        {errorText('phone')}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${baseId}-message`} className={labelClass}>Message</Label>
        <Textarea {...fieldProps('message')} required rows={5} className="min-h-32 bg-card text-foreground" />
        {errorText('message')}
      </div>

      <div ref={widgetRef} className="min-h-[65px]" />
      {securityError && (
        <p role="alert" className="text-sm text-destructive">
          Please wait a moment for the security check to finish, then send again.
        </p>
      )}

      {status === 'rate_limited' && (
        <p role="alert" className="text-sm text-destructive">
          You&apos;ve sent several messages just now; please try again in a few minutes.
        </p>
      )}
      {status === 'failed' && (
        <p role="alert" className="text-sm text-destructive [overflow-wrap:anywhere]">
          We couldn&apos;t send your message. Please email us at{' '}
          <a
            href={`mailto:${config.fallbackEmail}`}
            className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-accent"
          >
            {config.fallbackEmail}
          </a>
          .
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="pill-btn pill-btn--cta min-h-11 w-full justify-center px-8 py-3 text-sm sm:w-auto sm:self-start disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
