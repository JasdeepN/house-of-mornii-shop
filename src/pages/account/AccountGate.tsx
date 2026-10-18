import type { ReactNode } from 'react'
import { useCustomerSession } from '@/lib/customer'
import { useSignInDialog } from '@/context/SignInDialogContext'
import { Button } from '@/components/ui/button'

export function LoadingState() {
  return (
    <div className="min-h-screen pt-8 pb-16 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"
        />
        <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground">Loading...</span>
      </div>
    </div>
  )
}

function SignedOutPanel({ message }: { message: string }) {
  const { open } = useSignInDialog()
  return (
    <div className="min-h-screen pt-8 pb-16 flex items-center justify-center">
      <div className="text-center max-w-md">
        <h1 className="text-2xl tracking-widest mb-4">SIGN IN REQUIRED</h1>
        <p className="text-muted-foreground mb-6">{message}</p>
        <Button
          onClick={open}
          className="bg-accent text-accent-foreground hover:bg-accent/90 tracking-widest"
        >
          Sign in
        </Button>
      </div>
    </div>
  )
}

/** Shows the loading state or the sign-in panel until the Customer is signed in, then the children. */
export function AccountGate({ signedOutMessage, children }: { signedOutMessage: string; children: ReactNode }) {
  const { session } = useCustomerSession()
  if (session.status === 'loading') return <LoadingState />
  if (session.status === 'signed-out') return <SignedOutPanel message={signedOutMessage} />
  return <>{children}</>
}
