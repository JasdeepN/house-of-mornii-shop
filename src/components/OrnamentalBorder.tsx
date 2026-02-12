import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface OrnamentalBorderProps {
  children: ReactNode
  className?: string
}

export function OrnamentalBorder({ children, className }: OrnamentalBorderProps) {
  return (
    <div className={cn('relative', className)}>
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'oklch(0.75 0.12 85)', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: 'oklch(0.45 0.08 210)', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: 'oklch(0.75 0.12 85)', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        
        <rect
          x="2"
          y="2"
          width="calc(100% - 4px)"
          height="calc(100% - 4px)"
          fill="none"
          stroke="url(#borderGradient)"
          strokeWidth="2"
        />
        
        <g stroke="url(#borderGradient)" fill="none" strokeWidth="1.5">
          <path d="M 20 2 L 10 2 L 2 10 L 2 20" />
          <path d="M calc(100% - 20) 2 L calc(100% - 10) 2 L calc(100% - 2) 10 L calc(100% - 2) 20" />
          <path d="M 20 calc(100% - 2) L 10 calc(100% - 2) L 2 calc(100% - 10) L 2 calc(100% - 20)" />
          <path d="M calc(100% - 20) calc(100% - 2) L calc(100% - 10) calc(100% - 2) L calc(100% - 2) calc(100% - 10) L calc(100% - 2) calc(100% - 20)" />
        </g>
        
        <g fill="oklch(0.75 0.12 85)">
          <circle cx="20" cy="20" r="3" />
          <circle cx="calc(100% - 20)" cy="20" r="3" />
          <circle cx="20" cy="calc(100% - 20)" r="3" />
          <circle cx="calc(100% - 20)" cy="calc(100% - 20)" r="3" />
        </g>
      </svg>
      
      <div className="relative z-10 p-8">
        {children}
      </div>
    </div>
  )
}

export function OrnamentalDivider({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center my-12', className)}>
      <svg width="200" height="40" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="dividerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: 'oklch(0.75 0.12 85)', stopOpacity: 0 }} />
            <stop offset="50%" style={{ stopColor: 'oklch(0.75 0.12 85)', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: 'oklch(0.75 0.12 85)', stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        
        <line x1="0" y1="20" x2="70" y2="20" stroke="url(#dividerGradient)" strokeWidth="1" />
        <line x1="130" y1="20" x2="200" y2="20" stroke="url(#dividerGradient)" strokeWidth="1" />
        
        <path
          d="M 90 20 L 100 10 L 110 20 L 100 30 Z"
          fill="none"
          stroke="oklch(0.75 0.12 85)"
          strokeWidth="1.5"
        />
        
        <circle cx="100" cy="20" r="3" fill="oklch(0.45 0.08 210)" />
      </svg>
    </div>
  )
}
