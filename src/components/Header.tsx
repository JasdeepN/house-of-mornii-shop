import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { List, Handbag } from '@phosphor-icons/react'
import { useIsMobile } from '@/hooks/use-mobile'
import { BrandLockup } from '@/components/BrandLockup'
import { useCart } from '@/context/CartContext'

const navLinks = [
  { label: 'SHOP', href: '/shop', type: 'link' as const },
  { label: 'COLLECTIONS', href: '/collections', type: 'link' as const },
  { label: 'ABOUT', href: '#about', type: 'scroll' as const },
  { label: 'CONTACT', href: '#contact', type: 'scroll' as const },
]

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const location = useLocation()
  const { itemCount } = useCart()

  const scrollToSection = (href: string) => {
    setIsOpen(false)
    if (location.pathname === '/') {
      // Already on home page — just scroll
      const element = document.querySelector(href)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      // On another route — navigate home with hash, ScrollToHash handles the rest
      navigate('/' + href)
    }
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: 'oklch(0.18 0.03 210 / 0.30)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid oklch(1 0 0 / 0.12)',
        boxShadow: 'inset 0 1px 0 oklch(1 0 0 / 0.10), 0 4px 24px oklch(0 0 0 / 0.3)',
      }}
    >
      <div className="container mx-auto px-6 lg:px-20 relative">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <BrandLockup size="sm" />
          </div>

          {isMobile ? (
            <div className="flex items-center gap-3">
              <Link to="/cart" className="relative p-2 hover:text-accent transition-colors">
                <Handbag size={22} weight="bold" />
                {itemCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                    style={{ background: 'oklch(0.60 0.11 78)', color: 'oklch(0.15 0.02 210)' }}
                  >
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <List size={24} weight="bold" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-card border-gold">
                  <nav className="flex flex-col gap-6 mt-12">
                    {navLinks.map((link) =>
                      link.type === 'link' ? (
                        <Link
                          key={link.href}
                          to={link.href}
                          onClick={() => setIsOpen(false)}
                          className="text-lg tracking-widest hover:text-accent transition-colors text-left"
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <button
                          key={link.href}
                          onClick={() => scrollToSection(link.href)}
                          className="text-lg tracking-widest hover:text-accent transition-colors text-left"
                        >
                          {link.label}
                        </button>
                      ),
                    )}
                    <Button
                      className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold tracking-widest"
                      onClick={() => scrollToSection('#contact')}
                    >
                      BOOK A STYLING
                    </Button>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          ) : (
            <>
              <nav className="flex items-center gap-8">
                {navLinks.map((link) =>
                  link.type === 'link' ? (
                    <Link
                      key={link.href}
                      to={link.href}
                      className="text-sm tracking-widest hover:text-accent transition-colors relative group"
                    >
                      {link.label}
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300" />
                    </Link>
                  ) : (
                    <button
                      key={link.href}
                      onClick={() => scrollToSection(link.href)}
                      className="text-sm tracking-widest hover:text-accent transition-colors relative group"
                    >
                      {link.label}
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300" />
                    </button>
                  ),
                )}
              </nav>

              <div className="flex items-center gap-4">
                <Link to="/cart" className="relative p-2 hover:text-accent transition-colors">
                  <Handbag size={22} weight="bold" />
                  {itemCount > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                      style={{ background: 'oklch(0.60 0.11 78)', color: 'oklch(0.15 0.02 210)' }}
                    >
                      {itemCount > 9 ? '9+' : itemCount}
                    </span>
                  )}
                </Link>
                <Button
                  variant="outline"
                  className="border-accent text-foreground hover:bg-accent/10 font-semibold tracking-widest"
                  onClick={() => scrollToSection('#contact')}
                >
                  BOOK A STYLING
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
