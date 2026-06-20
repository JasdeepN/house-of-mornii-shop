import React from 'react'
import { OrnamentalDivider } from '@/components/OrnamentalBorder'
import { TrustBadges } from '@/components/TrustBadges'
import { NewsletterSignup } from '@/components/NewsletterSignup'

export function Footer() {
  return (
    <footer className="glass-panel glass-panel--full glass-panel--flat rounded-t-none relative z-50">
      <div className="container mx-auto px-6 lg:px-20 py-12">
        <div className="text-center space-y-4 relative z-10">
          <div className="flex items-center justify-center gap-3">
            <div className="text-xl footer-brand-name">
              <span className="font-bold tracking-wider text-[var(--foreground)]">HOUSE</span>
              <span className="font-script text-2xl ml-2 footer-brand-gold text-accent">Mornii</span>
            </div>
          </div>

          <OrnamentalDivider className="my-6" />

          <p className="text-sm tracking-[0.15em] footer-tagline text-muted-foreground/90">
            REGAL · RADIANT · MODERN
          </p>

          <TrustBadges variant="compact" className="mt-6" />

          <NewsletterSignup className="mt-8 pt-6" />

          <div className="pt-6 max-w-2xl mx-auto footer-divider border-t border-border/40">
            <p className="text-xs footer-copyright text-muted-foreground/70 leading-relaxed">
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
