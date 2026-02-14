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
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          objectFit: 'fill',
        }}
      />
      <div className="relative z-10 p-12 md:p-16 lg:p-20">
        {children}
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
