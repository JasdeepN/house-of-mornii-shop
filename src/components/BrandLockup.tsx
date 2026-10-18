import { cn } from '@/lib/utils'

interface BrandLockupProps {
  /** Scale the lockup: 'sm' for navbar, 'lg' for hero */
  size?: 'sm' | 'lg' | 'xl'
  className?: string
  /** Render as the page's h1 (the home hero) */
  as?: 'div' | 'h1'
}

export function BrandLockup({ size = 'sm', className, as: Tag = 'div' }: BrandLockupProps) {
  return (
    <Tag
      className={cn('flex flex-col items-center font-body leading-none select-none', className)}
      style={{ WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' }}
    >
      <span
        className={cn(
          'font-bold uppercase tracking-[0.28em]',
          size === 'xl' ? 'text-sm' : size === 'lg' ? 'text-sm' : 'text-xs',
          'brand-title'
        )}
      >
        House of
      </span>
      <span
        className={cn(
          'font-script',
          size === 'xl' ? 'text-7xl lg:text-8xl' : size === 'lg' ? 'text-6xl lg:text-7xl' : 'text-3xl lg:text-4xl',
          'brand-name'
        )}
      >
        Mornii
      </span>
    </Tag>
  )
}
