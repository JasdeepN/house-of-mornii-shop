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
          rx="24"
          ry="24"
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
          rx="20"
          ry="20"
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
          rx="16"
          ry="16"
          fill="none"
          stroke="url(#goldHighlight)"
          strokeWidth="0.5"
          opacity="0.5"
        />
      </svg>

      <svg className="absolute top-0 left-0 w-24 h-24 pointer-events-none" viewBox="0 0 80 80">
        <TopCornerOrnament />
      </svg>
      
      <svg className="absolute top-0 right-0 w-24 h-24 pointer-events-none" viewBox="0 0 80 80" style={{ transform: 'scaleX(-1)' }}>
        <TopCornerOrnament />
      </svg>
      
      <svg className="absolute bottom-0 left-0 w-36 h-36 pointer-events-none" viewBox="0 0 140 140">
        <BottomCornerOrnament />
      </svg>
      
      <svg className="absolute bottom-0 right-0 w-36 h-36 pointer-events-none" viewBox="0 0 140 140" style={{ transform: 'scaleX(-1)' }}>
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
        d="M 2 15 C 2 12, 3 10, 5 8 C 7 6, 10 5, 12 5 C 14 5, 16 6, 18 8 C 20 10, 22 13, 24 16 C 26 19, 28 22, 32 24"
        fill="none"
        stroke="url(#goldMetallic)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      <path
        d="M 15 2 C 12 2, 10 3, 8 5 C 6 7, 5 10, 5 12 C 5 14, 6 16, 8 18 C 10 20, 13 22, 16 24 C 19 26, 22 28, 24 32"
        fill="none"
        stroke="url(#goldMetallic)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      <path
        d="M 6 12 C 6 10, 7 9, 9 8 C 11 7, 13 7, 15 8 C 17 9, 19 11, 21 13 C 23 15, 25 18, 28 20"
        fill="none"
        stroke="url(#goldMetallic)"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.6"
      />
      
      <path
        d="M 12 6 C 10 6, 9 7, 8 9 C 7 11, 7 13, 8 15 C 9 17, 11 19, 13 21 C 15 23, 18 25, 20 28"
        fill="none"
        stroke="url(#goldMetallic)"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.6"
      />
      
      <path
        d="M 8 10 C 8 9, 9 8, 10 8 C 11 8, 12 9, 13 10 C 14 11, 15 13, 16 15 C 17 17, 18 19, 20 21"
        fill="none"
        stroke="url(#goldHighlight)"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.35"
      />
      
      <path
        d="M 10 8 C 9 8, 8 9, 8 10 C 8 11, 9 12, 10 13 C 11 14, 13 15, 15 16 C 17 17, 19 18, 21 20"
        fill="none"
        stroke="url(#goldHighlight)"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.35"
      />
    </g>
  )
}

function BottomCornerOrnament() {
  return (
    <g filter="url(#goldBevel)" transform="scale(1, -1) translate(0, -140)">
      <path
        d="M 2 20 C 2 15, 4 12, 7 10 C 10 8, 14 7, 18 8 C 22 9, 26 12, 30 16 C 34 20, 38 26, 42 32 C 46 38, 50 45, 55 52 C 60 59, 66 66, 72 72 C 78 78, 85 83, 92 86"
        fill="none"
        stroke="url(#goldMetallic)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      <path
        d="M 20 2 C 15 2, 12 4, 10 7 C 8 10, 7 14, 8 18 C 9 22, 12 26, 16 30 C 20 34, 26 38, 32 42 C 38 46, 45 50, 52 55 C 59 60, 66 66, 72 72 C 78 78, 83 85, 86 92"
        fill="none"
        stroke="url(#goldMetallic)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      <path
        d="M 8 18 C 8 14, 10 12, 12 10 C 14 8, 18 8, 22 10 C 26 12, 30 16, 34 20 C 38 24, 42 30, 47 36 C 52 42, 58 48, 64 54 C 70 60, 76 66, 82 70"
        fill="none"
        stroke="url(#goldMetallic)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      
      <path
        d="M 18 8 C 14 8, 12 10, 10 12 C 8 14, 8 18, 10 22 C 12 26, 16 30, 20 34 C 24 38, 30 42, 36 47 C 42 52, 48 58, 54 64 C 60 70, 66 76, 70 82"
        fill="none"
        stroke="url(#goldMetallic)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      
      <path
        d="M 12 15 C 12 12, 14 11, 16 10 C 18 9, 21 10, 24 12 C 27 14, 30 18, 34 22 C 38 26, 43 31, 48 37 C 53 43, 59 49, 65 55 C 71 61, 77 67, 82 72"
        fill="none"
        stroke="url(#goldHighlight)"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.3"
      />
      
      <path
        d="M 15 12 C 12 12, 11 14, 10 16 C 9 18, 10 21, 12 24 C 14 27, 18 30, 22 34 C 26 38, 31 43, 37 48 C 43 53, 49 59, 55 65 C 61 71, 67 77, 72 82"
        fill="none"
        stroke="url(#goldHighlight)"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.3"
      />
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
