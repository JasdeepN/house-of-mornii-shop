import { useState, useCallback, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { List, Handbag, Sun, Moon } from '@phosphor-icons/react'
import { useIsMobile } from '@/hooks/use-mobile'
import { BrandLockup } from '@/components/BrandLockup'
import { useCart } from '@/context/CartContext'
import { SearchBar } from '@/components/SearchBar'
import { useTheme } from '@/hooks/useTheme'

const navLinks = [
  { label: 'SHOP', href: '/shop' },
  { label: 'COLLECTIONS', href: '/collections' },
  { label: 'ABOUT', href: '/about' },
  { label: 'CONTACT', href: '/contact' },
]

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const { itemCount, openCart } = useCart()
  const { theme, toggleTheme } = useTheme()
  
  // Debounce navigation to prevent rapid state updates
  const navigateDebounced = useCallback(
    (path: string) => {
      if (navigateDebounced.timeoutId) {
        clearTimeout(navigateDebounced.timeoutId)
      }
      navigateDebounced.timeoutId = setTimeout(() => {
        navigate(path)
      }, 200) as unknown as number
    },
    [navigate],
  )
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (navigateDebounced.timeoutId) {
        clearTimeout(navigateDebounced.timeoutId)
      }
    }
  }, [])
  
  // Debounce sheet open state to prevent rapid toggling
  const setIsOpenDebounced = useCallback(
    (open: boolean) => {
      if (setIsOpenDebounced.timeoutId) {
        clearTimeout(setIsOpenDebounced.timeoutId)
      }
      setIsOpenDebounced.timeoutId = setTimeout(() => {
        setIsOpen(open)
      }, 100) as unknown as number
    },
    [],
  )
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (setIsOpenDebounced.timeoutId) {
        clearTimeout(setIsOpenDebounced.timeoutId)
      }
    }
  }, [])

  return (
    <header style={{ position: 'fixed', top: 0, left: 0, right: 0 }} className="z-50 glass-panel glass-panel--flat border-b border-border/40">
      <div className="container mx-auto px-6 lg:px-20 relative">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateDebounced('/')}>
            <BrandLockup size="sm" />
          </div>

          {isMobile ? (
              <div className="flex items-center gap-2">
                {/* Theme toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2 hover:text-accent transition-colors"
                  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {theme === 'dark' ? <Sun size={20} weight="bold" /> : <Moon size={20} weight="bold" />}
                </button>
                <button onClick={openCart} className="relative p-2 hover:text-accent transition-colors">
                <Handbag size={22} weight="bold" />
                {itemCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                    style={{ background: 'oklch(0.60 0.11 78)', color: 'oklch(0.15 0.02 210)' }}
                  >
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>
              <Sheet open={isOpen} onOpenChange={setIsOpenDebounced}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <List size={24} weight="bold" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-card border-gold">
                  <nav className="flex flex-col gap-6 mt-12">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={() => setIsOpenDebounced(false)}
                        className="text-lg tracking-widest hover:text-accent transition-colors text-left"
                      >
                        {link.label}
                      </Link>
                    ))}
                    <Link to="/contact" onClick={() => setIsOpenDebounced(false)}>
                      <Button
                        className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold tracking-widest w-full"
                      >
                        BOOK A STYLING
                      </Button>
                    </Link>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          ) : (
            <>
              <nav className="flex items-center gap-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="text-sm tracking-widest hover:text-accent transition-colors relative group"
                  >
                    {link.label}
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300" />
                  </Link>
                ))}
              </nav>

               <div className="flex items-center gap-3">
                {/* Theme toggle — desktop */}
                <button
                  onClick={toggleTheme}
                  className="p-2 hover:text-accent transition-colors hidden lg:inline-flex"
                  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {theme === 'dark' ? <Sun size={20} weight="bold" /> : <Moon size={20} weight="bold" />}
                </button>
                <SearchBar />
                <button onClick={openCart} className="relative p-2 hover:text-accent transition-colors">
                  <Handbag size={22} weight="bold" />
                  {itemCount > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                      style={{ background: 'oklch(0.60 0.11 78)', color: 'oklch(0.15 0.02 210)' }}
                    >
                      {itemCount > 9 ? '9+' : itemCount}
                    </span>
                  )}
                </button>
                <Link to="/contact">
                  <Button
                    variant="outline"
                    className="border-accent text-foreground hover:bg-accent/10 font-semibold tracking-widest"
                  >
                    BOOK A STYLING
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
