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
  /** Enable hover lift effect on the glass panel. Default: false */
  hoverable?: boolean
}

export function OrnamentalBorder({ 
  children, 
  className, 
  backgroundClassName,
  backgroundStyle,
  contentClassName = 'p-6 md:p-8 lg:p-10',
  hoverable = false,
}: OrnamentalBorderProps) {
  return (
    <div
      className={cn(
        'glass-panel',
        hoverable && 'glass-panel--hover',
        backgroundClassName,
        className,
      )}
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
