import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import baroqueBorder from '@/assets/images/Borders.png'
import dividerOrnament from '@/assets/ornaments/divider-ornament.svg'

interface OrnamentalBorderProps {
  children: ReactNode
  className?: string
}

export function OrnamentalBorder({ children, className }: OrnamentalBorderProps) {
  return (
    <div className={cn('relative', className)}>
      <img 
        src={baroqueBorder}
        alt=""
        className="absolute inset-0 w-full h-full pointer-events-none z-20"
        style={{
          objectFit: 'fill',
        }}
      />
      <div className="relative z-10 p-12 md:p-16 lg:p-20">
        <div 
          className="absolute inset-0 opacity-95"
          style={{
            background: `
              repeating-radial-gradient(
                circle at 0 0,
                transparent 0,
                oklch(0.60 0.11 78 / 0.08) 2px,
                transparent 4px,
                transparent 40px
              ),
              repeating-linear-gradient(
                45deg,
                oklch(0.45 0.08 210 / 0.05) 0px,
                oklch(0.45 0.08 210 / 0.05) 1px,
                transparent 1px,
                transparent 60px
              ),
              repeating-linear-gradient(
                -45deg,
                oklch(0.60 0.11 78 / 0.03) 0px,
                oklch(0.60 0.11 78 / 0.03) 1px,
                transparent 1px,
                transparent 60px
              ),
              radial-gradient(
                ellipse at 30% 40%,
                oklch(0.25 0.03 210) 0%,
                oklch(0.18 0.02 210) 100%
              )
            `,
            backgroundSize: `
              80px 80px,
              120px 120px,
              120px 120px,
              100% 100%
            `,
          }}
        />
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  )
}

export function OrnamentalDivider({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center my-8', className)}>
      <img 
        src={dividerOrnament}
        alt=""
        className="w-64 h-12 object-contain"
      />
    </div>
  )
}
