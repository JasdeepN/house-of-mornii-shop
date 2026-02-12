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
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="borderGold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: 'oklch(0.55 0.10 75)', stopOpacity: 0.6 }} />
            <stop offset="50%" style={{ stopColor: 'oklch(0.65 0.12 80)', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: 'oklch(0.55 0.10 75)', stopOpacity: 0.6 }} />
          </linearGradient>
        </defs>
        
        <rect
          x="1"
          y="1"
          width="calc(100% - 2px)"
          height="calc(100% - 2px)"
          fill="none"
          stroke="oklch(0.60 0.11 78)"
          strokeWidth="1"
        />
        
        <rect
          x="4"
          y="4"
          width="calc(100% - 8px)"
          height="calc(100% - 8px)"
          fill="none"
          stroke="oklch(0.60 0.11 78)"
          strokeWidth="0.5"
          opacity="0.6"
        />
      </svg>

      <svg className="absolute top-0 left-0 w-20 h-20 pointer-events-none" viewBox="0 0 80 80">
        <CornerOrnament />
      </svg>
      
      <svg className="absolute top-0 right-0 w-20 h-20 pointer-events-none" viewBox="0 0 80 80" style={{ transform: 'scaleX(-1)' }}>
        <CornerOrnament />
      </svg>
      
      <svg className="absolute bottom-0 left-0 w-20 h-20 pointer-events-none" viewBox="0 0 80 80" style={{ transform: 'scaleY(-1)' }}>
        <CornerOrnament />
      </svg>
      
      <svg className="absolute bottom-0 right-0 w-20 h-20 pointer-events-none" viewBox="0 0 80 80" style={{ transform: 'scale(-1)' }}>
        <CornerOrnament />
      </svg>
      
      <div className="relative z-10 p-8">
        {children}
      </div>
    </div>
  )
}

function CornerOrnament() {
  const goldColor = "oklch(0.60 0.11 78)"
  
  return (
    <g>
      <path
        d="M 5 5 L 25 5 M 5 5 L 5 25"
        stroke={goldColor}
        strokeWidth="1.5"
        fill="none"
      />
      
      <path
        d="M 8 8 L 20 8 M 8 8 L 8 20"
        stroke={goldColor}
        strokeWidth="0.5"
        fill="none"
        opacity="0.6"
      />
      
      <path
        d="M 5 15 Q 10 10 15 5"
        stroke={goldColor}
        strokeWidth="0.5"
        fill="none"
        opacity="0.5"
      />
      
      <circle cx="25" cy="5" r="2" fill={goldColor} opacity="0.8" />
      <circle cx="5" cy="25" r="2" fill={goldColor} opacity="0.8" />
      
      <path
        d="M 15 5 L 18 8 L 15 11 L 12 8 Z"
        fill="none"
        stroke={goldColor}
        strokeWidth="0.5"
        opacity="0.7"
      />
      
      <path
        d="M 5 15 L 8 18 L 11 15 L 8 12 Z"
        fill="none"
        stroke={goldColor}
        strokeWidth="0.5"
        opacity="0.7"
      />
      
      <path
        d="M 23 7 C 23 7, 25 10, 22 12 M 7 23 C 7 23, 10 25, 12 22"
        stroke={goldColor}
        strokeWidth="0.5"
        fill="none"
        opacity="0.6"
      />
      
      <circle cx="15" cy="5" r="1" fill={goldColor} opacity="0.6" />
      <circle cx="5" cy="15" r="1" fill={goldColor} opacity="0.6" />
      
      <path
        d="M 20 8 Q 22 10 20 12 M 8 20 Q 10 22 12 20"
        stroke={goldColor}
        strokeWidth="0.5"
        fill="none"
        opacity="0.5"
      />
    </g>
  )
}

export function OrnamentalDivider({ className }: { className?: string }) {
  const goldColor = "oklch(0.60 0.11 78)"
  
  return (
    <div className={cn('flex items-center justify-center my-12', className)}>
      <svg width="280" height="50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 50">
        <defs>
          <linearGradient id="dividerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: goldColor, stopOpacity: 0 }} />
            <stop offset="50%" style={{ stopColor: goldColor, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: goldColor, stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        
        <line x1="0" y1="25" x2="100" y2="25" stroke="url(#dividerGradient)" strokeWidth="1" />
        <line x1="180" y1="25" x2="280" y2="25" stroke="url(#dividerGradient)" strokeWidth="1" />
        
        <g transform="translate(140, 25)">
          <path
            d="M 0 -15 L 3 -12 L 0 -9 L -3 -12 Z"
            fill="none"
            stroke={goldColor}
            strokeWidth="1"
          />
          <path
            d="M 0 15 L 3 12 L 0 9 L -3 12 Z"
            fill="none"
            stroke={goldColor}
            strokeWidth="1"
          />
          
          <line x1="0" y1="-8" x2="0" y2="-2" stroke={goldColor} strokeWidth="1" />
          <line x1="0" y1="2" x2="0" y2="8" stroke={goldColor} strokeWidth="1" />
          
          <circle cx="0" cy="0" r="4" fill="none" stroke={goldColor} strokeWidth="1" />
          <circle cx="0" cy="0" r="2" fill={goldColor} opacity="0.8" />
          
          <path
            d="M -12 -3 L -8 0 L -12 3"
            fill="none"
            stroke={goldColor}
            strokeWidth="0.75"
            opacity="0.7"
          />
          <path
            d="M 12 -3 L 8 0 L 12 3"
            fill="none"
            stroke={goldColor}
            strokeWidth="0.75"
            opacity="0.7"
          />
          
          <circle cx="-15" cy="0" r="1.5" fill={goldColor} opacity="0.6" />
          <circle cx="15" cy="0" r="1.5" fill={goldColor} opacity="0.6" />
          
          <path
            d="M -10 -8 Q -8 -10 -6 -8 M 6 -8 Q 8 -10 10 -8"
            fill="none"
            stroke={goldColor}
            strokeWidth="0.5"
            opacity="0.6"
          />
          <path
            d="M -10 8 Q -8 10 -6 8 M 6 8 Q 8 10 10 8"
            fill="none"
            stroke={goldColor}
            strokeWidth="0.5"
            opacity="0.6"
          />
        </g>
        
        <g transform="translate(110, 25)">
          <path d="M 0 -5 L 3 0 L 0 5 L -3 0 Z" fill="none" stroke={goldColor} strokeWidth="0.75" opacity="0.7" />
        </g>
        <g transform="translate(170, 25)">
          <path d="M 0 -5 L 3 0 L 0 5 L -3 0 Z" fill="none" stroke={goldColor} strokeWidth="0.75" opacity="0.7" />
        </g>
      </svg>
    </div>
  )
}
