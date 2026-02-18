import { ReactNode, CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import baroqueBorder from '@/assets/images/Borders-tight.png'

interface OrnamentalBorderProps {
  children: ReactNode
  className?: string
  /**
   * Additional Tailwind classes for the background layer.
   */
  backgroundClassName?: string
  /**
   * Inline styles for the background layer. Defaults to the glassy card style.
   */
  backgroundStyle?: CSSProperties
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
}: OrnamentalBorderProps) {
  return (
    <div
      className={cn('relative', backgroundClassName, className)}
      style={backgroundStyle}
    >
      <div className="relative z-10 p-8 md:p-12 lg:p-16">
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
