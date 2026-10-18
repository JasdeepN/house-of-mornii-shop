import { useState, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { List, Handbag } from '@phosphor-icons/react'
import { useIsMobile } from '@/hooks/use-mobile'
import { BrandLockup } from '@/components/BrandLockup'
import { useCart } from '@/context/CartContext'
import { SearchBar } from '@/components/SearchBar'
import { CustomerMenu } from '@/components/CustomerMenu'
import { useCustomerSession } from '@/lib/customer'
import { useSignInDialog } from '@/context/SignInDialogContext'
import { useShopBrand } from '@/lib/shopify'

function BagButton({ itemCount, onClick }: { itemCount: number; onClick: () => void }) {
  const label = itemCount > 0 ? `Bag, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}` : 'Bag'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="relative flex size-11 items-center justify-center hover:text-accent transition-colors"
    >
      <Handbag size={22} weight="bold" aria-hidden="true" />
      {itemCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center bg-accent text-accent-foreground"
        >
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
    </button>
  )
}

/** Champagne (#F0E4D2): the logo's lettering is dark teal, so the logo only ever sits on this. */
const CHAMPAGNE = 'bg-[oklch(0.92_0.025_82)]'

/** The shop's Brand logo, or today's lettering while it loads or when Brand settings are empty. */
function BrandMark({ className }: { className?: string }) {
  const { logo } = useShopBrand()
  return logo ? (
    <img
      src={logo.url}
      alt="House of Mornii"
      width={118}
      height={120}
      className={className ?? 'h-[100px] w-[100px] md:h-[120px] md:w-[118px] object-contain'}
    />
  ) : (
    <span className="flex h-[100px] items-center md:h-[120px]">
      {/* Dark teal, not the gold of the page lockup: gold on champagne is under 3:1 */}
      <BrandLockup size="lg" className="gap-2 [&_.brand-title]:text-[oklch(0.336_0.054_200.5)]! [&_.brand-name]:text-[oklch(0.336_0.054_200.5)]!" />
    </span>
  )
}

const navLinks = [
  { label: 'SHOP', href: '/shop' },
  { label: 'COLLECTIONS', href: '/collections' },
  { label: 'ABOUT', href: '/about' },
  { label: 'CONTACT', href: '/contact' },
]

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const isMobile = useIsMobile()
  const { itemCount, openCart } = useCart()
  const { session } = useCustomerSession()
  const { open: openSignIn } = useSignInDialog()

  // Debounce sheet open state to prevent rapid toggling
  const sheetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const setIsOpenDebounced = useCallback(
    (open: boolean) => {
      if (sheetTimeoutRef.current) {
        clearTimeout(sheetTimeoutRef.current)
      }
      sheetTimeoutRef.current = setTimeout(() => {
        setIsOpen(open)
      }, 100)
    },
    [],
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sheetTimeoutRef.current) {
        clearTimeout(sheetTimeoutRef.current)
      }
    }
  }, [])

  return (
    <>
    {/* Logo row: scrolls away with the page. Fixed height, so the logo loading in never shifts the page. */}
    <div className={`flex justify-center py-2 ${CHAMPAGNE}`}>
      <Link
        to="/"
        aria-label="House of Mornii, home"
        className="flex items-center rounded-sm text-[oklch(0.33_0.054_200)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.33_0.054_200)]"
      >
        <BrandMark />
      </Link>
    </div>
    {/* Teal bar: stays pinned to the top. Inline position: .glass-panel sets position: relative, which beats the class. */}
    <header style={{ position: 'sticky', top: 0 }} className="sticky top-0 z-50 glass-panel glass-panel--flat bar-teal">
      <div className="container mx-auto px-4 sm:px-6 lg:px-20 relative">
        <div className="flex items-center justify-between h-20">

          {isMobile ? (
              <div className="ml-auto flex items-center">
                <CustomerMenu />
                <SearchBar />
                <BagButton itemCount={itemCount} onClick={openCart} />
              <Sheet open={isOpen} onOpenChange={setIsOpenDebounced}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-11 text-foreground hover:bg-primary-hover hover:text-foreground" aria-label="Open menu">
                    <List size={24} weight="bold" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-card border-border">
                  <div className={`mx-auto mt-8 flex w-48 justify-center rounded-md py-3 ${CHAMPAGNE}`}>
                    <BrandMark />
                  </div>
                  <nav className="flex flex-col gap-6 mt-6">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={() => setIsOpenDebounced(false)}
                        className="flex min-h-11 items-center text-lg tracking-widest hover:text-accent transition-colors text-left"
                      >
                        {link.label}
                      </Link>
                    ))}
                    {session.status === 'signed-in' ? (
                      <Link
                        to="/account"
                        onClick={() => setIsOpenDebounced(false)}
                        className="flex min-h-11 items-center text-lg tracking-widest hover:text-accent transition-colors text-left"
                      >
                        ACCOUNT
                      </Link>
                    ) : session.status === 'signed-out' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpenDebounced(false)
                          openSignIn()
                        }}
                        className="flex min-h-11 items-center text-lg tracking-widest hover:text-accent transition-colors text-left"
                      >
                        SIGN IN
                      </button>
                    ) : null}
                    <Button
                      asChild
                      className="mt-4 min-h-11 bg-primary text-primary-foreground hover:bg-primary-hover font-semibold tracking-widest w-full"
                    >
                      <Link to="/contact" onClick={() => setIsOpenDebounced(false)}>
                        BOOK A STYLING
                      </Link>
                    </Button>
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
                {/* Customer menu */}
                <CustomerMenu />
                <SearchBar />
                <BagButton itemCount={itemCount} onClick={openCart} />
                <Button
                  asChild
                  variant="outline"
                  className="min-h-11 border-accent bg-transparent text-foreground hover:bg-primary-hover hover:text-foreground font-semibold tracking-widest"
                >
                  <Link to="/contact">BOOK A STYLING</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
    </>
  )
}
