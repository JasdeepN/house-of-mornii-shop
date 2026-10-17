/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { SignInDialog } from '@/components/SignInDialog'

interface SignInDialogContextValue {
  open: () => void
}

const SignInDialogContext = createContext<SignInDialogContextValue | null>(null)

export function SignInDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const open = useCallback(() => setIsOpen(true), [])
  const value = useMemo(() => ({ open }), [open])

  return (
    <SignInDialogContext.Provider value={value}>
      {children}
      <SignInDialog open={isOpen} onOpenChange={setIsOpen} />
    </SignInDialogContext.Provider>
  )
}

export function useSignInDialog(): SignInDialogContextValue {
  const ctx = useContext(SignInDialogContext)
  if (!ctx) throw new Error('useSignInDialog must be used within SignInDialogProvider')
  return ctx
}
