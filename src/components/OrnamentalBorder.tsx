import { ReactNode, CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import baroqueBorder from '@/assets/images/Borders-tight.png'

interface OrnamentalBorderProps {
  children: ReactNode
  className?: string
  backgroundClassName?: string
  backgroundStyle?: CSSProperties
  /** Override the inner content wrapper padding. Defaults to 'p-6 md:p-8 lg:p-10' */
  contentClassName?: string
}

const defaultBackgroundStyle: CSSProperties = {
  background: 'oklch(0.18 0.03 210 / 0.55)',
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
  boxShadow: 'inset 0 1px 0 oklch(1 0 0 / 0.10), inset 0 -1px 0 oklch(0 0 0 / 0.25)',
}

export function OrnamentalBorder({ 
  children, 
  className, 
  backgroundClassName,
  backgroundStyle = defaultBackgroundStyle,
  contentClassName = 'p-6 md:p-8 lg:p-10',
}: OrnamentalBorderProps) {
  return (
    <div
      className={cn('relative', backgroundClassName, className)}
      style={backgroundStyle}
    >
      <div className={cn('relative z-10', contentClassName)}>
        {children}
      </div>

      <div
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          borderStyle: 'solid',
          borderWidth: '50px',
          borderImageSource: `url(${baroqueBorder})`,
          borderImageSlice: '180',
          borderImageWidth: '50px',
          borderImageOutset: '24px',
          borderImageRepeat: 'stretch'
        }}
        aria-hidden="true"
      />
    </div>
  )
}

export function OrnamentalDivider({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center my-8', className)}>
      <div className="w-64 h-[1px] bg-border" />
    </div>
  )
}
