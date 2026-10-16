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
import { useCustomerSession } from '@/lib/customer'

interface SignInDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function SignInDialog({ open, onOpenChange }: SignInDialogProps) {
  const { signIn } = useCustomerSession()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = email.trim()
      if (!trimmed) {
        setError('Please enter your email.')
        return
      }
      if (!EMAIL_PATTERN.test(trimmed)) {
        setError('Please enter a valid email address.')
        return
      }
      setError(null)
      signIn(trimmed)
    },
    [email, signIn],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass-panel border-gold z-[60]">
        <DialogHeader>
          <DialogTitle className="text-center text-lg tracking-widest">SIGN IN</DialogTitle>
          <DialogDescription className="text-center">
            Share your email and we will send you a one-time code. No password needed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 mt-4">
          {error && (
            <div
              role="alert"
              className="p-3 rounded bg-destructive/10 border border-destructive/20 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="sign-in-email" className="text-xs tracking-widest uppercase text-muted-foreground">
              Email
            </label>
            <Input
              id="sign-in-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              className="bg-card/50 border-gold/30"
            />
          </div>

          <Button
            type="submit"
            className="mt-2 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold tracking-widest"
          >
            CONTINUE
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
