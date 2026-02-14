import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface OrnamentalBorderProps {
  children: ReactNode
  className?: string
  useImageBorder?: boolean
  borderImage?: string
}

export function OrnamentalBorder({ children, className, useImageBorder = false, borderImage }: OrnamentalBorderProps) {
  if (useImageBorder && borderImage) {
    return (
      <div className={cn('relative', className)}>
        <div 
          className="absolute inset-0 pointer-events-none bg-contain bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${borderImage})`,
            backgroundSize: '100% 100%',
          }}
        />
        <div className="relative z-10 p-12 md:p-16 lg:p-20">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="goldMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#6B5742', stopOpacity: 1 }} />
            <stop offset="20%" style={{ stopColor: '#8B7355', stopOpacity: 1 }} />
            <stop offset="35%" style={{ stopColor: '#C9A961', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#F4E7C3', stopOpacity: 1 }} />
            <stop offset="65%" style={{ stopColor: '#D4AF37', stopOpacity: 1 }} />
            <stop offset="80%" style={{ stopColor: '#A38B5F', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#6B5742', stopOpacity: 1 }} />
          </linearGradient>
          
          <linearGradient id="goldDark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#8B7355', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#C9A961', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#8B7355', stopOpacity: 1 }} />
          </linearGradient>
          
          <filter id="goldBevel">
            <feGaussianBlur in="SourceAlpha" stdDeviation="0.8" result="blur"/>
            <feSpecularLighting in="blur" surfaceScale="4" specularConstant="1.2" specularExponent="25" lighting-color="#F4E7C3" result="specOut">
              <fePointLight x="-5000" y="-10000" z="20000"/>
            </feSpecularLighting>
            <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut"/>
            <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
          </filter>
          
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <rect
          x="4"
          y="4"
          width="calc(100% - 8px)"
          height="calc(100% - 8px)"
          rx="16"
          ry="16"
          fill="none"
          stroke="url(#goldMetallic)"
          strokeWidth="2"
          filter="url(#goldBevel)"
        />
        
        <rect
          x="8"
          y="8"
          width="calc(100% - 16px)"
          height="calc(100% - 16px)"
          rx="12"
          ry="12"
          fill="none"
          stroke="url(#goldDark)"
          strokeWidth="1.5"
          opacity="0.8"
        />
      </svg>

      <svg className="absolute top-0 left-0 w-20 h-20 pointer-events-none" viewBox="0 0 100 100">
        <TopCornerOrnament />
      </svg>
      
      <svg className="absolute top-0 right-0 w-20 h-20 pointer-events-none" viewBox="0 0 100 100" style={{ transform: 'scaleX(-1)' }}>
        <TopCornerOrnament />
      </svg>
      
      <svg className="absolute bottom-0 left-0 w-32 h-32 pointer-events-none" viewBox="0 0 150 150">
        <BottomCornerOrnament />
      </svg>
      
      <svg className="absolute bottom-0 right-0 w-32 h-32 pointer-events-none" viewBox="0 0 150 150" style={{ transform: 'scaleX(-1)' }}>
        <BottomCornerOrnament />
      </svg>
      
      <div className="relative z-10 p-12 md:p-16">
        {children}
      </div>
    </div>
  )
}

function TopCornerOrnament() {
  return (
    <g filter="url(#goldBevel)">
      <path
        d="M 4 20 Q 4 12 8 8 Q 12 4 20 4"
        fill="none"
        stroke="url(#goldMetallic)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      
      <path
        d="M 8 24 Q 8 14 14 10 Q 18 8 26 8"
        fill="none"
        stroke="url(#goldDark)"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.7"
      />
      
      <path
        d="M 10 18 Q 12 14 16 12 Q 20 10 24 12 Q 28 14 30 18"
        fill="none"
        stroke="url(#goldMetallic)"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.5"
      />
      
      <path
        d="M 18 10 Q 14 12 12 16 Q 10 20 12 24 Q 14 28 18 30"
        fill="none"
        stroke="url(#goldMetallic)"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.5"
      />
      
      <circle cx="18" cy="18" r="3" fill="url(#goldMetallic)" opacity="0.6" filter="url(#softGlow)" />
      <circle cx="14" cy="14" r="2" fill="#F4E7C3" opacity="0.8" />
    </g>
  )
}

function BottomCornerOrnament() {
  return (
    <g filter="url(#goldBevel)" transform="scale(1, -1) translate(0, -150)">
      <path
        d="M 4 30 Q 4 18 10 12 Q 16 6 30 6"
        fill="none"
        stroke="url(#goldMetallic)"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      
      <path
        d="M 10 35 Q 10 22 18 16 Q 24 12 38 12"
        fill="none"
        stroke="url(#goldDark)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.75"
      />
      
      <path
        d="M 14 26 Q 18 20 24 16 Q 30 12 36 14 Q 42 16 48 22 Q 54 28 58 36"
        fill="none"
        stroke="url(#goldMetallic)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      
      <path
        d="M 26 14 Q 20 18 16 24 Q 12 30 14 36 Q 16 42 22 48 Q 28 54 36 58"
        fill="none"
        stroke="url(#goldMetallic)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      
      <path
        d="M 18 22 Q 22 18 28 18 Q 34 18 38 22 Q 42 26 42 32"
        fill="none"
        stroke="url(#goldMetallic)"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.4"
      />
      
      <path
        d="M 22 18 Q 18 22 18 28 Q 18 34 22 38 Q 26 42 32 42"
        fill="none"
        stroke="url(#goldMetallic)"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.4"
      />
      
      <circle cx="28" cy="28" r="4" fill="url(#goldMetallic)" opacity="0.7" filter="url(#softGlow)" />
      <circle cx="24" cy="24" r="2.5" fill="#F4E7C3" opacity="0.9" />
      <circle cx="20" cy="20" r="1.5" fill="#C9A961" opacity="0.6" />
    </g>
  )
}

export function OrnamentalDivider({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center my-12', className)}>
      <svg width="320" height="60" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 60">
        <defs>
          <linearGradient id="dividerGoldMetallic" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#8B7355', stopOpacity: 1 }} />
            <stop offset="25%" style={{ stopColor: '#D4AF37', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#F4E7C3', stopOpacity: 1 }} />
            <stop offset="75%" style={{ stopColor: '#C9A961', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#8B7355', stopOpacity: 1 }} />
          </linearGradient>
          
          <linearGradient id="dividerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#6B5742', stopOpacity: 0 }} />
            <stop offset="50%" style={{ stopColor: '#D4AF37', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#6B5742', stopOpacity: 0 }} />
          </linearGradient>
          
          <radialGradient id="dividerRadial">
            <stop offset="0%" style={{ stopColor: '#F4E7C3', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#D4AF37', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#8B7355', stopOpacity: 1 }} />
          </radialGradient>
          
          <filter id="dividerBevel">
            <feGaussianBlur in="SourceAlpha" stdDeviation="0.5" result="blur"/>
            <feSpecularLighting in="blur" surfaceScale="2" specularConstant="0.8" specularExponent="15" lighting-color="#F4E7C3" result="specOut">
              <fePointLight x="-5000" y="-10000" z="20000"/>
            </feSpecularLighting>
            <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut"/>
            <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
          </filter>
        </defs>
        
        <line x1="0" y1="30" x2="110" y2="30" stroke="url(#dividerGradient)" strokeWidth="1.5" />
        <line x1="210" y1="30" x2="320" y2="30" stroke="url(#dividerGradient)" strokeWidth="1.5" />
        
        <g transform="translate(160, 30)" filter="url(#dividerBevel)">
          <ellipse cx="0" cy="0" rx="15" ry="10" fill="url(#dividerRadial)" stroke="url(#dividerGoldMetallic)" strokeWidth="1.2"/>
          
          <path
            d="M 0 -18 L 4 -14 L 0 -10 L -4 -14 Z"
            fill="url(#dividerRadial)"
            stroke="url(#dividerGoldMetallic)"
            strokeWidth="1"
          />
          <path
            d="M 0 18 L 4 14 L 0 10 L -4 14 Z"
            fill="url(#dividerRadial)"
            stroke="url(#dividerGoldMetallic)"
            strokeWidth="1"
          />
          
          <path
            d="M -22 -5 C -20 -8, -18 -10, -15 -8 C -12 -6, -11 -2, -13 1 C -15 4, -19 5, -22 3 Z"
            fill="url(#dividerRadial)"
            stroke="url(#dividerGoldMetallic)"
            strokeWidth="0.8"
          />
          <path
            d="M 22 -5 C 20 -8, 18 -10, 15 -8 C 12 -6, 11 -2, 13 1 C 15 4, 19 5, 22 3 Z"
            fill="url(#dividerRadial)"
            stroke="url(#dividerGoldMetallic)"
            strokeWidth="0.8"
          />
          
          <path
            d="M -22 5 C -20 8, -18 10, -15 8 C -12 6, -11 2, -13 -1 C -15 -4, -19 -5, -22 -3 Z"
            fill="url(#dividerRadial)"
            stroke="url(#dividerGoldMetallic)"
            strokeWidth="0.8"
          />
          <path
            d="M 22 5 C 20 8, 18 10, 15 8 C 12 6, 11 2, 13 -1 C 15 -4, 19 -5, 22 -3 Z"
            fill="url(#dividerRadial)"
            stroke="url(#dividerGoldMetallic)"
            strokeWidth="0.8"
          />
          
          <circle cx="0" cy="0" r="5" fill="none" stroke="url(#dividerGoldMetallic)" strokeWidth="1.2" />
          <circle cx="0" cy="0" r="2.5" fill="#F4E7C3" opacity="0.9" />
          
          <circle cx="-28" cy="0" r="2" fill="url(#dividerRadial)" stroke="#F4E7C3" strokeWidth="0.5"/>
          <circle cx="28" cy="0" r="2" fill="url(#dividerRadial)" stroke="#F4E7C3" strokeWidth="0.5"/>
          
          <path
            d="M -10 -12 Q -8 -15 -6 -12 M 6 -12 Q 8 -15 10 -12"
            fill="none"
            stroke="#F4E7C3"
            strokeWidth="0.8"
            opacity="0.8"
          />
          <path
            d="M -10 12 Q -8 15 -6 12 M 6 12 Q 8 15 10 12"
            fill="none"
            stroke="#F4E7C3"
            strokeWidth="0.8"
            opacity="0.8"
          />
        </g>
        
        <g transform="translate(120, 30)" filter="url(#dividerBevel)">
          <path d="M 0 -6 L 3 0 L 0 6 L -3 0 Z" fill="url(#dividerRadial)" stroke="url(#dividerGoldMetallic)" strokeWidth="0.8" />
          <circle cx="0" cy="0" r="1" fill="#F4E7C3" opacity="0.9"/>
        </g>
        <g transform="translate(200, 30)" filter="url(#dividerBevel)">
          <path d="M 0 -6 L 3 0 L 0 6 L -3 0 Z" fill="url(#dividerRadial)" stroke="url(#dividerGoldMetallic)" strokeWidth="0.8" />
          <circle cx="0" cy="0" r="1" fill="#F4E7C3" opacity="0.9"/>
        </g>
      </svg>
    </div>
  )
}
