import { ShieldCheck } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

const badges = [
  { icon: ShieldCheck, label: 'Secure Checkout', sub: 'SSL Encrypted' },
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
            <Icon size={14} weight="bold" className="text-accent" />
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
        'flex flex-wrap justify-center gap-3',
        className,
      )}
    >
      {badges.map(({ icon: Icon, label, sub }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-1.5 py-3 px-4 rounded-sm text-center bg-card border border-border"
        >
          <Icon size={22} weight="bold" className="text-accent" />
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
          className="text-[10px] tracking-[0.1em] uppercase px-2.5 py-1 rounded-sm border border-border text-muted-foreground"
        >
          {name}
        </span>
      ))}
    </div>
  )
}
