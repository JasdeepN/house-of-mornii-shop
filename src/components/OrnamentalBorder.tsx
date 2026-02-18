import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import baroqueBorder from '@/assets/images/Borders-tight.png'

interface OrnamentalBorderProps {
  children: ReactNode
  className?: string
  /**
   * Background styling for the card canvas (applied to the content container).
   * Defaults to bg-card with radial gradient.
   */
  backgroundClassName?: string
}

export function OrnamentalBorder({ 
  children, 
  className, 
  backgroundClassName = "bg-card shadow-2xl bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03)_0%,_transparent_70%)]"
}: OrnamentalBorderProps) {
  return (
    <div className={cn('relative', className)}>
      <div className={cn('absolute inset-0 z-0', backgroundClassName)} />

      <div className="relative z-10 p-8 md:p-12 lg:p-16">
        {children}
      </div>

      <div
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          borderStyle: 'solid',
          borderWidth: '50px',
          borderImageSource: `url(${baroqueBorder})`,
          borderImageSlice: '180 fill',
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
