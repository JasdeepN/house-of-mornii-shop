import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { User, SignOut, Scroll, AddressBook } from '@phosphor-icons/react'
import { useCustomerSession } from '@/lib/customer'
import { useSignInDialog } from '@/context/SignInDialogContext'

export function CustomerMenu() {
  const { session, signOut } = useCustomerSession()
  const { open: openSignIn } = useSignInDialog()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // While loading, render nothing so the signed-out control never flashes.
  if (session.status === 'loading') return null

  if (session.status === 'signed-out') {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={openSignIn}
        className="p-2 text-foreground hover:bg-primary-hover hover:text-foreground transition-colors"
        aria-label="Sign in"
      >
        <User size={22} weight="bold" />
      </Button>
    )
  }

  const { customer } = session
  const label = customer.name.trim() || customer.email
  const initials = label[0]?.toUpperCase() ?? ''

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 hover:opacity-80 transition-opacity outline-none"
        aria-label={label}
        aria-expanded={isOpen}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold bg-accent text-accent-foreground"
        >
          {initials}
        </div>
      </button>

      {isOpen && (
        <div
          className="on-page absolute right-0 mt-2 w-56 rounded-sm shadow-lg border border-border bg-card z-[100] overflow-hidden"
        >
          <div className="px-3 py-2 text-sm border-b border-border">
            <p className="font-medium tracking-wide">
              {label}
            </p>
            {customer.name.trim() && (
              <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
            )}
          </div>

          <div className="py-1">
            <Link
              to="/account"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors cursor-pointer"
            >
              <User className="h-4 w-4" /> Details
            </Link>
            <Link
              to="/account/orders"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors cursor-pointer"
            >
              <Scroll className="h-4 w-4" /> Orders
            </Link>
            <Link
              to="/account/addresses"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors cursor-pointer"
            >
              <AddressBook className="h-4 w-4" /> Addresses
            </Link>
          </div>

          <div className="border-t border-border py-1">
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors cursor-pointer"
            >
              <SignOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
