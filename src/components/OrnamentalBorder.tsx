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
          <linearGradient id="goldMetallic" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#8B7355', stopOpacity: 1 }} />
            <stop offset="15%" style={{ stopColor: '#D4AF37', stopOpacity: 1 }} />
            <stop offset="30%" style={{ stopColor: '#F4E7C3', stopOpacity: 1 }} />
            <stop offset="45%" style={{ stopColor: '#C9A961', stopOpacity: 1 }} />
            <stop offset="60%" style={{ stopColor: '#8B7355', stopOpacity: 1 }} />
            <stop offset="75%" style={{ stopColor: '#D4AF37', stopOpacity: 1 }} />
            <stop offset="90%" style={{ stopColor: '#A38B5F', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#6B5742', stopOpacity: 1 }} />
          </linearGradient>
          
          <linearGradient id="goldHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#6B5742', stopOpacity: 0.8 }} />
            <stop offset="25%" style={{ stopColor: '#F4E7C3', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#D4AF37', stopOpacity: 1 }} />
            <stop offset="75%" style={{ stopColor: '#F4E7C3', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#6B5742', stopOpacity: 0.8 }} />
          </linearGradient>
          
          <radialGradient id="goldRadial">
            <stop offset="0%" style={{ stopColor: '#F4E7C3', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#D4AF37', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#8B7355', stopOpacity: 1 }} />
          </radialGradient>
          
          <filter id="goldBevel">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur"/>
            <feSpecularLighting in="blur" surfaceScale="3" specularConstant="1" specularExponent="20" lighting-color="#F4E7C3" result="specOut">
              <fePointLight x="-5000" y="-10000" z="20000"/>
            </feSpecularLighting>
            <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut"/>
            <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
          </filter>
        </defs>
        
        <rect
          x="2"
          y="2"
          width="calc(100% - 4px)"
          height="calc(100% - 4px)"
          rx="16"
          ry="16"
          fill="none"
          stroke="url(#goldMetallic)"
          strokeWidth="2"
          filter="url(#goldBevel)"
        />
        
        <rect
          x="6"
          y="6"
          width="calc(100% - 12px)"
          height="calc(100% - 12px)"
          rx="12"
          ry="12"
          fill="none"
          stroke="url(#goldMetallic)"
          strokeWidth="1"
          opacity="0.7"
        />
        
        <rect
          x="10"
          y="10"
          width="calc(100% - 20px)"
          height="calc(100% - 20px)"
          rx="8"
          ry="8"
          fill="none"
          stroke="url(#goldHighlight)"
          strokeWidth="0.5"
          opacity="0.5"
        />
      </svg>

      <svg className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 w-24 h-20 pointer-events-none z-20" viewBox="0 0 120 80">
        <TopCenterpiece />
      </svg>

      <svg className="absolute top-0 left-0 w-16 h-16 pointer-events-none" viewBox="0 0 80 80">
        <TopCornerOrnament />
      </svg>
      
      <svg className="absolute top-0 right-0 w-16 h-16 pointer-events-none" viewBox="0 0 80 80" style={{ transform: 'scaleX(-1)' }}>
        <TopCornerOrnament />
      </svg>
      
      <svg className="absolute bottom-0 left-0 w-28 h-28 pointer-events-none" viewBox="0 0 140 140">
        <BottomCornerOrnament />
      </svg>
      
      <svg className="absolute bottom-0 right-0 w-28 h-28 pointer-events-none" viewBox="0 0 140 140" style={{ transform: 'scaleX(-1)' }}>
        <BottomCornerOrnament />
      </svg>
      
      <div className="relative z-10 p-12 md:p-16">
        {children}
      </div>
    </div>
  )
}

function TopCenterpiece() {
  return (
    <g filter="url(#goldBevel)">
      <path
        d="M 60 8 Q 55 10 50 8 Q 48 5 50 3 Q 55 0 60 3 Q 62 5 60 8 Z"
        fill="url(#goldRadial)"
        stroke="url(#goldMetallic)"
        strokeWidth="1.2"
      />
      
      <path
        d="M 60 8 L 60 25"
        stroke="url(#goldMetallic)"
        strokeWidth="1.5"
        fill="none"
      />
      
      <ellipse 
        cx="60" 
        cy="30" 
        rx="8" 
        ry="12" 
        fill="url(#goldRadial)" 
        stroke="url(#goldMetallic)" 
        strokeWidth="1.5"
      />
      
      <path
        d="M 50 30 Q 45 25 42 28 Q 40 32 43 36 Q 48 40 52 38"
        fill="url(#goldRadial)"
        stroke="url(#goldMetallic)"
        strokeWidth="0.8"
        opacity="0.9"
      />
      <path
        d="M 70 30 Q 75 25 78 28 Q 80 32 77 36 Q 72 40 68 38"
        fill="url(#goldRadial)"
        stroke="url(#goldMetallic)"
        strokeWidth="0.8"
        opacity="0.9"
      />
      
      <circle cx="60" cy="30" r="4" fill="#F4E7C3" opacity="0.8"/>
      <circle cx="60" cy="30" r="2" fill="url(#goldRadial)" opacity="0.9"/>
      
      <path
        d="M 35 32 Q 30 30 28 33 Q 27 37 30 40 Q 33 42 36 40"
        fill="url(#goldRadial)"
        stroke="url(#goldMetallic)"
        strokeWidth="0.6"
      />
      <path
        d="M 85 32 Q 90 30 92 33 Q 93 37 90 40 Q 87 42 84 40"
        fill="url(#goldRadial)"
        stroke="url(#goldMetallic)"
        strokeWidth="0.6"
      />
      
      <path
        d="M 52 45 Q 54 50 56 52 L 60 55 L 64 52 Q 66 50 68 45"
        fill="none"
        stroke="url(#goldMetallic)"
        strokeWidth="1"
      />
      
      <circle cx="45" cy="35" r="1.5" fill="#F4E7C3" opacity="0.7"/>
      <circle cx="75" cy="35" r="1.5" fill="#F4E7C3" opacity="0.7"/>
    </g>
  )
}

function TopCornerOrnament() {
  return (
    <g filter="url(#goldBevel)">
      <path
        d="M 5 5 L 30 5 L 28 7 L 7 7 L 7 28 L 5 30 Z"
        fill="url(#goldMetallic)"
        stroke="url(#goldHighlight)"
        strokeWidth="1"
      />
      
      <path
        d="M 10 10 L 22 10 L 21 11 L 11 11 L 11 21 L 10 22 Z"
        fill="none"
        stroke="url(#goldMetallic)"
        strokeWidth="0.5"
        opacity="0.7"
      />
      
      <path
        d="M 8 18 Q 12 14 16 12 Q 18 10 22 8"
        fill="none"
        stroke="url(#goldMetallic)"
        strokeWidth="0.8"
      />
      
      <circle cx="25" cy="8" r="2.5" fill="url(#goldRadial)" stroke="#F4E7C3" strokeWidth="0.5"/>
      <circle cx="8" cy="25" r="2.5" fill="url(#goldRadial)" stroke="#F4E7C3" strokeWidth="0.5"/>
      
      <path
        d="M 18 5 L 20 7 L 18 9 L 16 7 Z"
        fill="url(#goldRadial)"
        stroke="url(#goldMetallic)"
        strokeWidth="0.6"
      />
      <path
        d="M 5 18 L 7 20 L 9 18 L 7 16 Z"
        fill="url(#goldRadial)"
        stroke="url(#goldMetallic)"
        strokeWidth="0.6"
      />
      
      <path
        d="M 28 10 C 28 10, 26 12, 24 10 C 26 8, 28 10, 28 10 Z"
        fill="url(#goldRadial)"
        stroke="url(#goldMetallic)"
        strokeWidth="0.5"
      />
      <path
        d="M 10 28 C 10 28, 12 26, 10 24 C 8 26, 10 28, 10 28 Z"
        fill="url(#goldRadial)"
        stroke="url(#goldMetallic)"
        strokeWidth="0.5"
      />
    </g>
  )
}

function BottomCornerOrnament() {
  return (
    <g filter="url(#goldBevel)" transform="scale(1, -1) translate(0, -140)">
      <path
        d="M 5 5 L 50 5 C 48 8, 45 10, 42 13 L 10 13 L 10 42 C 8 45, 5 48, 5 50 Z"
        fill="url(#goldMetallic)"
        stroke="url(#goldHighlight)"
        strokeWidth="1.5"
      />
      
      <path
        d="M 12 12 L 40 12 L 38 14 L 14 14 L 14 38 L 12 40 Z"
        fill="none"
        stroke="url(#goldMetallic)"
        strokeWidth="1"
        opacity="0.8"
      />
      
      <path
        d="M 18 18 L 32 18 L 31 19 L 19 19 L 19 31 L 18 32 Z"
        fill="none"
        stroke="url(#goldMetallic)"
        strokeWidth="0.6"
        opacity="0.6"
      />
      
      <path
        d="M 10 35 Q 18 28 25 22 Q 30 18 38 12"
        fill="none"
        stroke="url(#goldMetallic)"
        strokeWidth="1.2"
      />
      
      <path
        d="M 12 42 Q 20 35 28 28 Q 33 23 40 18"
        fill="none"
        stroke="#F4E7C3"
        strokeWidth="0.5"
        opacity="0.7"
      />
      
      <ellipse cx="42" cy="10" rx="4" ry="5" fill="url(#goldRadial)" stroke="#F4E7C3" strokeWidth="0.8"/>
      <ellipse cx="10" cy="42" rx="5" ry="4" fill="url(#goldRadial)" stroke="#F4E7C3" strokeWidth="0.8"/>
      
      <path
        d="M 30 5 L 34 9 L 30 13 L 26 9 Z"
        fill="url(#goldRadial)"
        stroke="url(#goldMetallic)"
        strokeWidth="1"
      />
      <path
        d="M 5 30 L 9 34 L 13 30 L 9 26 Z"
        fill="url(#goldRadial)"
        stroke="url(#goldMetallic)"
        strokeWidth="1"
      />
      
      <circle cx="20" cy="8" r="3" fill="url(#goldRadial)" stroke="url(#goldMetallic)" strokeWidth="0.6"/>
      <circle cx="8" cy="20" r="3" fill="url(#goldRadial)" stroke="url(#goldMetallic)" strokeWidth="0.6"/>
      
      <path
        d="M 45 15 C 43 12, 40 12, 38 14 C 36 16, 36 19, 38 21 C 40 23, 43 23, 45 21 Z"
        fill="url(#goldRadial)"
        stroke="url(#goldMetallic)"
        strokeWidth="0.8"
      />
      <path
        d="M 15 45 C 12 43, 12 40, 14 38 C 16 36, 19 36, 21 38 C 23 40, 23 43, 21 45 Z"
        fill="url(#goldRadial)"
        stroke="url(#goldMetallic)"
        strokeWidth="0.8"
      />
      
      <path
        d="M 48 8 Q 46 10 44 8 M 8 48 Q 10 46 8 44"
        fill="none"
        stroke="#F4E7C3"
        strokeWidth="0.8"
        opacity="0.9"
      />
      
      <path
        d="M 35 18 C 35 15, 32 13, 30 15 C 28 17, 29 20, 31 21 C 33 22, 35 21, 35 18 Z"
        fill="url(#goldRadial)"
        stroke="url(#goldMetallic)"
        strokeWidth="0.5"
      />
      <path
        d="M 18 35 C 15 35, 13 32, 15 30 C 17 28, 20 29, 21 31 C 22 33, 21 35, 18 35 Z"
        fill="url(#goldRadial)"
        stroke="url(#goldMetallic)"
        strokeWidth="0.5"
      />
      
      <circle cx="25" cy="12" r="1.5" fill="#F4E7C3" opacity="0.9"/>
      <circle cx="12" cy="25" r="1.5" fill="#F4E7C3" opacity="0.9"/>
      <circle cx="38" cy="20" r="1.5" fill="#F4E7C3" opacity="0.9"/>
      <circle cx="20" cy="38" r="1.5" fill="#F4E7C3" opacity="0.9"/>
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
