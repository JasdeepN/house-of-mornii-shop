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

interface LoginModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigateToRegister?: () => void
  onNavigateToRecovery?: () => void
}

export function LoginModal({
  open,
  onOpenChange,
  onNavigateToRegister,
  onNavigateToRecovery,
}: LoginModalProps) {
  const { login, isLoading, lastError } = useCustomerAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (isSubmitting) return
      setIsSubmitting(true)
      try {
        await login(email, password)
        onOpenChange(false)
        setEmail('')
        setPassword('')
      } catch {
        // Error handled by context
      } finally {
        setIsSubmitting(false)
      }
    },
    [login, email, password, onOpenChange, isSubmitting],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass-panel border-gold">
        <DialogHeader>
          <DialogTitle className="text-center text-lg tracking-widest">SIGN IN</DialogTitle>
          <DialogDescription className="text-center">
            Access your account and order history
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          {lastError && lastError.length > 0 && (
            <div className="p-3 rounded bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              {lastError[0].message}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="login-email" className="text-xs tracking-widest uppercase text-muted-foreground">
              Email
            </label>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              className="bg-card/50 border-gold/30"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="login-password" className="text-xs tracking-widest uppercase text-muted-foreground">
              Password
            </label>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="bg-card/50 border-gold/30"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="mt-2 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold tracking-widest"
          >
            {isSubmitting ? 'Signing In...' : 'SIGN IN'}
          </Button>

          <div className="flex items-center justify-between mt-2 text-sm">
            {onNavigateToRegister && (
              <button
                type="button"
                onClick={onNavigateToRegister}
                className="text-muted-foreground hover:text-accent transition-colors"
              >
                Create account
              </button>
            )}
            {onNavigateToRecovery && (
              <button
                type="button"
                onClick={onNavigateToRecovery}
                className="text-muted-foreground hover:text-accent transition-colors"
              >
                Forgot password?
              </button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
