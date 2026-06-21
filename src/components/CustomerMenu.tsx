import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { User, SignOut, Scroll, AddressBook } from '@phosphor-icons/react'
import { useCustomerAuth } from '@/context/CustomerAuthContext'

interface CustomerMenuProps {
  onLoginClick?: () => void
}

export function CustomerMenu({ onLoginClick }: CustomerMenuProps) {
  const { customer, isAuthenticated, logout } = useCustomerAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true)
    try {
      await logout()
    } catch {
      // Even if logout fails, clear local state
    } finally {
      setIsLoggingOut(false)
    }
  }, [logout])

  if (!isAuthenticated || !customer) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={onLoginClick}
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 p-1 hover:opacity-80 transition-opacity">
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
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 glass-panel border-gold mt-2">
        <div className="px-3 py-2 text-sm">
          <p className="font-medium tracking-wide">
            {customer.firstName && customer.lastName
              ? `${customer.firstName} ${customer.lastName}`
              : 'Customer'}
          </p>
          <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/account" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" /> My Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/account/orders" className="cursor-pointer">
            <Scroll className="mr-2 h-4 w-4" /> Orders
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/account/addresses" className="cursor-pointer">
            <AddressBook className="mr-2 h-4 w-4" /> Addresses
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
          <SignOut className="mr-2 h-4 w-4" /> Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
