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

interface PasswordRecoveryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigateToLogin?: () => void
}

export function PasswordRecoveryModal({
  open,
  onOpenChange,
  onNavigateToLogin,
}: PasswordRecoveryModalProps) {
  const { initiatePasswordRecovery, isLoading, lastError } = useCustomerAuth()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (isSubmitting) return
      setIsSubmitting(true)
      try {
        await initiatePasswordRecovery(email)
        setIsSubmitted(true)
      } catch {
        // Error handled by context
      } finally {
        setIsSubmitting(false)
      }
    },
    [initiatePasswordRecovery, email, isSubmitting],
  )

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open)
      if (!open) {
        setIsSubmitted(false)
        setEmail('')
      }
    }}>
      <DialogContent className="sm:max-w-md glass-panel border-gold">
        <DialogHeader>
          <DialogTitle className="text-center text-lg tracking-widest">
            {isSubmitted ? 'CHECK YOUR EMAIL' : 'RESET PASSWORD'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isSubmitted
              ? 'We\'ve sent a password reset link to your email address.'
              : 'Enter your email and we\'ll send you a reset link.'}
          </DialogDescription>
        </DialogHeader>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
            {lastError && lastError.length > 0 && (
              <div className="p-3 rounded bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                {lastError[0].message}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="recovery-email" className="text-xs tracking-widest uppercase text-muted-foreground">
                Email
              </label>
              <Input
                id="recovery-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="bg-card/50 border-gold/30"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="mt-2 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold tracking-widest"
            >
              {isSubmitting ? 'Sending...' : 'SEND RESET LINK'}
            </Button>

            {onNavigateToLogin && (
              <div className="text-center text-sm mt-2">
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="text-muted-foreground hover:text-accent transition-colors"
                >
                  Back to sign in
                </button>
              </div>
            )}
          </form>
        ) : (
          <div className="flex flex-col gap-4 mt-4">
            <p className="text-sm text-center text-muted-foreground">
              If an account exists for {email}, you will receive a password reset link shortly.
            </p>
            {onNavigateToLogin && (
              <Button
                variant="outline"
                onClick={onNavigateToLogin}
                className="border-gold/30 hover:bg-accent/10 tracking-widest"
              >
                Back to sign in
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
