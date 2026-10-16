import { useState, useCallback, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { User, SignOut, Scroll, AddressBook } from '@phosphor-icons/react'
import { useCustomerAuth } from '@/context/CustomerAuthContext'

interface CustomerMenuProps {
  onLoginClick?: () => void
}

export function CustomerMenu({ onLoginClick }: CustomerMenuProps) {
  const { customer, isAuthenticated, logout } = useCustomerAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true)
    try {
      await logout()
    } catch {
      // Even if logout fails, clear local state
    } finally {
      setIsLoggingOut(false)
      setIsOpen(false)
    }
  }, [logout])

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

  if (!isAuthenticated || !customer) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onLoginClick?.()}
        className="p-2 hover:text-accent transition-colors"
        aria-label="Sign in"
      >
        <User size={22} weight="bold" />
      </Button>
    )
  }

  const firstNameInitial = customer.firstName?.[0] ?? ''
  const lastNameInitial = customer.lastName?.[0] ?? ''
  const emailInitial = customer.email?.[0]?.toUpperCase() ?? ''
  const initials = `${firstNameInitial}${lastNameInitial}`.toUpperCase() || emailInitial

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 hover:opacity-80 transition-opacity outline-none"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
          style={{
            background: 'oklch(0.60 0.11 78)',
            color: 'oklch(0.15 0.02 210)',
          }}
        >
          {initials}
        </div>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-lg shadow-2xl border z-[100] overflow-hidden"
          style={{
            background: 'oklch(0.18 0.03 210 / 0.95)',
            backdropFilter: 'blur(16px) saturate(170%) contrast(115%)',
            borderColor: 'oklch(0.60 0.11 78 / 0.25)',
            color: 'oklch(0.92 0.01 78)',
          }}
        >
          <div className="px-3 py-2 text-sm border-b" style={{ borderColor: 'oklch(1 0 0 / 0.08)' }}>
            <p className="font-medium tracking-wide">
              {customer.firstName && customer.lastName
                ? `${customer.firstName} ${customer.lastName}`
                : 'Customer'}
            </p>
            <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
          </div>

          <div className="py-1">
            <Link
              to="/account"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 transition-colors cursor-pointer"
            >
              <User className="h-4 w-4" /> My Account
            </Link>
            <Link
              to="/account/orders"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 transition-colors cursor-pointer"
            >
              <Scroll className="h-4 w-4" /> Orders
            </Link>
            <Link
              to="/account/addresses"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 transition-colors cursor-pointer"
            >
              <AddressBook className="h-4 w-4" /> Addresses
            </Link>
          </div>

          <div className="border-t py-1" style={{ borderColor: 'oklch(1 0 0 / 0.08)' }}>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
            >
              <SignOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
