const FREE_SHIPPING_THRESHOLD = 150 // dollars

interface FreeShippingBarProps {
  subtotalAmount: string
  className?: string
}

export function FreeShippingBar({ subtotalAmount, className }: FreeShippingBarProps) {
  const subtotal = parseFloat(subtotalAmount)
  const remaining = FREE_SHIPPING_THRESHOLD - subtotal
  const progress = Math.min(subtotal / FREE_SHIPPING_THRESHOLD, 1)

  return (
    <div className={className}>
      {remaining > 0 ? (
        <p className="text-xs tracking-[0.12em] text-muted-foreground text-center mb-2">
          You're <span style={{ color: 'oklch(0.60 0.11 78)' }}>${remaining.toFixed(0)}</span> away from free shipping!
        </p>
      ) : (
        <p className="text-xs tracking-[0.12em] text-center mb-2" style={{ color: 'oklch(0.60 0.11 78)' }}>
          You've unlocked free shipping!
        </p>
      )}
      <div
        className="h-1.5 w-full rounded-full overflow-hidden"
        style={{ background: 'oklch(1 0 0 / 0.08)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress * 100}%`,
            background: progress >= 1
              ? 'oklch(0.60 0.11 78)'
              : 'linear-gradient(90deg, oklch(0.60 0.11 78 / 0.6), oklch(0.60 0.11 78))',
          }}
        />
      </div>
    </div>
  )
}
