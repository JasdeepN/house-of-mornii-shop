import React from 'react'
import { OrnamentalDivider } from '@/components/OrnamentalBorder'
import { TrustBadges } from '@/components/TrustBadges'

const etchedText: React.CSSProperties = {
  textShadow: '0 0 12px oklch(0.60 0.08 210 / 0.5), 0 1px 8px oklch(0 0 0 / 0.4)',
  color: 'oklch(0.95 0.02 210)',
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
}

const etchedFaint: React.CSSProperties = {
  textShadow: '0 0 10px oklch(0.60 0.08 210 / 0.35), 0 1px 6px oklch(0 0 0 / 0.3)',
  color: 'oklch(0.82 0.03 210)',
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
}

export function Footer() {
  return (
    <footer
      style={{
        background: 'oklch(0.20 0.03 210 / 0.15)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid oklch(1 0 0 / 0.10)',
        boxShadow:
          'inset 0 1px 0 oklch(1 0 0 / 0.12), inset 0 -1px 0 oklch(0 0 0 / 0.35), 0 -8px 32px oklch(0 0 0 / 0.45)',
      }}
    >
      <div className="container mx-auto px-6 lg:px-20 py-12">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="text-xl" style={etchedText}>
              <span className="font-bold tracking-wider">HOUSE</span>
              <span
                className="font-script text-2xl ml-2"
                style={{ ...etchedText, color: 'oklch(0.60 0.11 78)', textShadow: '0 0 14px oklch(0.60 0.11 78 / 0.5), 0 1px 8px oklch(0 0 0 / 0.4)' }}
              >
                Mornii
              </span>
            </div>
          </div>

          <OrnamentalDivider className="my-6" />

          <p className="text-sm tracking-[0.15em]" style={etchedFaint}>
            REGAL · RADIANT · MODERN
          </p>

          <TrustBadges variant="compact" className="mt-6" />

          <div
            className="pt-6 max-w-2xl mx-auto"
            style={{ borderTop: '1px solid oklch(1 0 0 / 0.07)' }}
          >
            <p className="text-xs" style={etchedFaint}>
              © {new Date().getFullYear()} House of Mornii. All rights reserved.
              <br />
              Heritage-inspired costume jewellery for life's most precious moments.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
