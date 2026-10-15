import { ReactNode, CSSProperties } from 'react'
import { cn } from '@/lib/utils'

interface OrnamentalBorderProps {
  children: ReactNode
  className?: string
  backgroundClassName?: string
  backgroundStyle?: CSSProperties
  /** Override the inner content wrapper padding. Defaults to 'p-6 md:p-8 lg:p-10' */
  contentClassName?: string
  /** Enable hover lift effect on the glass panel. Default: false */
  hoverable?: boolean
  /** Hide the golden glow under-lighting effect. Default: false */
  noGlow?: boolean
  /**
   * Apply the ornate French gold baroque frame with corner rosettes,
   * metallic sheen, and hammered metal texture.
   * Uses the existing `.french-gold-frame` CSS class from index.scss.
   * Default: false
   */
  frameVariant?: boolean
}

export function OrnamentalBorder({
  children,
  className,
  backgroundClassName,
  backgroundStyle,
  contentClassName = 'p-6 md:p-8 lg:p-10',
  hoverable = false,
  noGlow = false,
  frameVariant = false,
}: OrnamentalBorderProps) {
  return (
    <div
      className={cn(
        'glass-panel',
        !noGlow && 'golden-glow',
        hoverable && 'glass-panel--hover',
        backgroundClassName,
        className,
      )}
      style={backgroundStyle}
    >
      {frameVariant && <span className="french-gold-frame" aria-hidden="true" />}
      <div className={cn('relative z-10', contentClassName)}>
        {children}
      </div>
    </div>
  )
}

/**
 * Ornate divider with Art Nouveau-inspired flourish pattern.
 * Renders an inline SVG that inherits `currentColor` for theme compatibility.
 */
export function OrnamentalDivider({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center my-8 text-muted-foreground/60',
        className,
      )}
      aria-hidden="true"
    >
      <svg
        width="120"
        height="20"
        viewBox="0 0 120 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-32 h-5"
      >
        <path
          d="M5 10C5 10 15 2 30 2C45 2 55 10 60 10C65 10 75 18 90 18C105 18 115 10 115 10"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="5" cy="10" r="2.5" fill="currentColor" />
        <circle cx="30" cy="10" r="2.5" fill="currentColor" />
        <circle cx="60" cy="10" r="2.5" fill="currentColor" />
        <circle cx="90" cy="10" r="2.5" fill="currentColor" />
        <circle cx="115" cy="10" r="2.5" fill="currentColor" />
      </svg>
    </div>
  )
}
