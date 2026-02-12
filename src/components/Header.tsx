import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { List } from '@phosphor-icons/react'
import { useIsMobile } from '@/hooks/use-mobile'

const navLinks = [
  { label: 'COLLECTIONS', href: '#collections' },
  { label: 'SIGNATURE', href: '#signature' },
  { label: 'ABOUT', href: '#about' },
  { label: 'CONTACT', href: '#contact' },
]

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const isMobile = useIsMobile()

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setIsOpen(false)
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-6 lg:px-20">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
            <div className="text-2xl lg:text-3xl">
              <span className="font-bold tracking-wider">HOUSE</span>
              <br />
              <span className="font-script text-3xl lg:text-4xl -mt-2 block">Mornii</span>
            </div>
          </div>

          {isMobile ? (
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold tracking-widest"
                onClick={() => scrollToSection('#contact')}
              >
                SHOP
              </Button>
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <List size={24} weight="bold" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-card border-gold">
                  <nav className="flex flex-col gap-6 mt-12">
                    {navLinks.map((link) => (
                      <button
                        key={link.href}
                        onClick={() => scrollToSection(link.href)}
                        className="text-lg tracking-widest hover:text-accent transition-colors text-left"
                      >
                        {link.label}
                      </button>
                    ))}
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
                {navLinks.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => scrollToSection(link.href)}
                    className="text-sm tracking-widest hover:text-accent transition-colors relative group"
                  >
                    {link.label}
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300" />
                  </button>
                ))}
              </nav>

              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  className="border-accent text-foreground hover:bg-accent/10 font-semibold tracking-widest"
                  onClick={() => scrollToSection('#contact')}
                >
                  SHOP
                </Button>
                <Button
                  className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold tracking-widest"
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
