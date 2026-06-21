import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useCustomerAuth } from '@/context/CustomerAuthContext'
import type { CustomerCreateInput } from '@/lib/shopify/types'

interface RegisterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigateToLogin?: () => void
}

export function RegisterModal({
  open,
  onOpenChange,
  onNavigateToLogin,
}: RegisterModalProps) {
  const { register, isLoading, lastError } = useCustomerAuth()
  const [formData, setFormData] = useState<CustomerCreateInput>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (isSubmitting) return
      setIsSubmitting(true)
      try {
        await register(formData)
        onOpenChange(false)
        setFormData({ email: '', password: '', firstName: '', lastName: '' })
      } catch {
        // Error handled by context
      } finally {
        setIsSubmitting(false)
      }
    },
    [register, formData, onOpenChange, isSubmitting],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass-panel border-gold">
        <DialogHeader>
          <DialogTitle className="text-center text-lg tracking-widest">CREATE ACCOUNT</DialogTitle>
          <DialogDescription className="text-center">
            Join us to save your details and track orders
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          {lastError && lastError.length > 0 && (
            <div className="p-3 rounded bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              {lastError[0].message}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <label htmlFor="register-firstName" className="text-xs tracking-widest uppercase text-muted-foreground">
                First Name
              </label>
              <Input
                id="register-firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="First name"
                className="bg-card/50 border-gold/30"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="register-lastName" className="text-xs tracking-widest uppercase text-muted-foreground">
                Last Name
              </label>
              <Input
                id="register-lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Last name"
                className="bg-card/50 border-gold/30"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="register-email" className="text-xs tracking-widest uppercase text-muted-foreground">
              Email
            </label>
            <Input
              id="register-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="your@email.com"
              className="bg-card/50 border-gold/30"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="register-password" className="text-xs tracking-widest uppercase text-muted-foreground">
              Password
            </label>
            <Input
              id="register-password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={8}
              placeholder="Min. 8 characters"
              className="bg-card/50 border-gold/30"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="mt-2 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold tracking-widest"
          >
            {isSubmitting ? 'Creating...' : 'CREATE ACCOUNT'}
          </Button>

          {onNavigateToLogin && (
            <div className="text-center text-sm mt-2">
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="text-muted-foreground hover:text-accent transition-colors"
              >
                Already have an account? Sign in
              </button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
