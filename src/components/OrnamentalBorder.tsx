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

      <svg className="absolute top-0 left-0 w-20 h-20 pointer-events-none" viewBox="0 0 80 80">
        <TopCornerOrnament />
      </svg>
      
      <svg className="absolute top-0 right-0 w-20 h-20 pointer-events-none" viewBox="0 0 80 80" style={{ transform: 'scaleX(-1)' }}>
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

function TopCornerOrnament() {
  return (
    <g filter="url(#goldBevel)">
      <path
        d="M 2 5 Q 5 10 8 12 Q 12 15 15 18 Q 18 20 22 22 Q 25 22 28 20 Q 32 16 35 12 Q 38 8 42 5"
        fill="none"
        stroke="url(#goldMetallic)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      <path
        d="M 5 2 Q 10 5 12 8 Q 15 12 18 15 Q 20 18 22 22 Q 22 25 20 28 Q 16 32 12 35 Q 8 38 5 42"
        fill="none"
        stroke="url(#goldMetallic)"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.7"
      />
      
      <path
        d="M 8 8 Q 12 12 16 14 Q 18 15 20 16 Q 22 16 24 14 Q 28 10 32 8"
        fill="none"
        stroke="url(#goldHighlight)"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.4"
      />
      
      <path
        d="M 8 8 Q 12 12 14 16 Q 15 18 16 20 Q 16 22 14 24 Q 10 28 8 32"
        fill="none"
        stroke="url(#goldHighlight)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.3"
      />
    </g>
  )
}

function BottomCornerOrnament() {
  return (
    <g filter="url(#goldBevel)" transform="scale(1, -1) translate(0, -140)">
      <path
        d="M 2 5 Q 8 15 12 22 Q 18 32 25 42 Q 32 50 42 60 Q 50 65 60 68 Q 68 68 75 65"
        fill="none"
        stroke="url(#goldMetallic)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      
      <path
        d="M 5 2 Q 15 8 22 12 Q 32 18 42 25 Q 50 32 60 42 Q 65 50 68 60 Q 68 68 65 75"
        fill="none"
        stroke="url(#goldMetallic)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      
      <path
        d="M 8 8 Q 18 18 25 28 Q 32 38 40 48 Q 48 55 58 60"
        fill="none"
        stroke="url(#goldHighlight)"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.35"
      />
      
      <path
        d="M 8 8 Q 18 18 28 25 Q 38 32 48 40 Q 55 48 60 58"
        fill="none"
        stroke="url(#goldHighlight)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.25"
      />
      
      <path
        d="M 12 18 Q 22 28 32 38 Q 40 46 50 55"
        fill="none"
        stroke="url(#goldMetallic)"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.5"
      />
      
      <path
        d="M 18 12 Q 28 22 38 32 Q 46 40 55 50"
        fill="none"
        stroke="url(#goldMetallic)"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.4"
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
