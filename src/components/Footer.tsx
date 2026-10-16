import React from 'react'
import { Link } from 'react-router-dom'
import { OrnamentalDivider } from '@/components/OrnamentalBorder'
import { TrustBadges } from '@/components/TrustBadges'
import { NewsletterSignup } from '@/components/NewsletterSignup'

const footerLinks = [
  { label: 'SHOP', href: '/shop' },
  { label: 'COLLECTIONS', href: '/collections' },
  { label: 'ABOUT', href: '/about' },
  { label: 'CONTACT', href: '/contact' },
]

export function Footer() {
  return (
    <footer className="glass-panel glass-panel--full glass-panel--flat rounded-t-none relative z-50">
      <div className="container mx-auto px-6 lg:px-20 py-10">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">
          {/* Brand + tagline */}
          <div className="flex flex-col items-center lg:items-start gap-3 text-center lg:text-left">
            <div className="text-xl footer-brand-name">
              <span className="font-bold tracking-wider text-[var(--foreground)]">HOUSE</span>
              <span className="font-script text-2xl ml-2 footer-brand-gold text-accent">Mornii</span>
            </div>
            <p className="text-sm tracking-[0.15em] footer-tagline text-muted-foreground/90">
              REGAL · RADIANT · MODERN
            </p>
            <nav className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-2">
              {footerLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-xs tracking-[0.15em] text-muted-foreground hover:text-accent transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center">
            <TrustBadges variant="compact" />
          </div>

          {/* Newsletter */}
          <div className="flex items-center justify-center lg:justify-end">
            <NewsletterSignup />
          </div>
        </div>

        <OrnamentalDivider className="my-6" />

        <div className="text-center">
          <p className="text-xs footer-copyright text-muted-foreground/70 leading-relaxed">
            © {new Date().getFullYear()} House of Mornii. All rights reserved.
            {' '}Heritage-inspired costume jewellery for life's most precious moments.
          </p>
        </div>
      </div>
    </footer>
  )
}
