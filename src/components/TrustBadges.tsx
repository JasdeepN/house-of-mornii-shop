import { ShieldCheck, Package, ArrowCounterClockwise, Certificate } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

const badges = [
  { icon: ShieldCheck, label: 'Secure Checkout', sub: 'SSL Encrypted' },
  { icon: Package, label: 'Free Shipping', sub: 'On All Orders' },
  { icon: ArrowCounterClockwise, label: 'Easy Returns', sub: '30-Day Policy' },
  { icon: Certificate, label: 'Authenticity', sub: 'Guaranteed' },
] as const

interface TrustBadgesProps {
  variant?: 'full' | 'compact'
  className?: string
}

export function TrustBadges({ variant = 'full', className }: TrustBadgesProps) {
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center justify-center gap-6 flex-wrap', className)}>
        {badges.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <Icon
              size={14}
              weight="bold"
              style={{ color: 'oklch(0.60 0.11 78)' }}
            />
            <span className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
              {label}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'grid grid-cols-2 lg:grid-cols-4 gap-3',
        className,
      )}
    >
      {badges.map(({ icon: Icon, label, sub }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-sm text-center"
          style={{
            background: 'oklch(1 0 0 / 0.03)',
            border: '1px solid oklch(1 0 0 / 0.06)',
          }}
        >
          <Icon
            size={22}
            weight="bold"
            style={{ color: 'oklch(0.60 0.11 78)' }}
          />
          <span className="text-[11px] tracking-[0.12em] uppercase font-semibold">
            {label}
          </span>
          <span className="text-[10px] text-muted-foreground tracking-wider">
            {sub}
          </span>
        </div>
      ))}
    </div>
  )
}

export function PaymentIcons({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-3 flex-wrap', className)}>
      {['Visa', 'Mastercard', 'Amex', 'Apple Pay', 'Google Pay'].map((name) => (
        <span
          key={name}
          className="text-[10px] tracking-[0.1em] uppercase px-2.5 py-1 rounded-sm"
          style={{
            border: '1px solid oklch(1 0 0 / 0.10)',
            color: 'oklch(0.75 0.02 210)',
            background: 'oklch(1 0 0 / 0.03)',
          }}
        >
          {name}
        </span>
      ))}
    </div>
  )
}
