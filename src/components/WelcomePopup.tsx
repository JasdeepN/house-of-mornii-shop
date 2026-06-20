import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from '@phosphor-icons/react'
import { NewsletterSignup } from './NewsletterSignup'
import { getWelcomePopupConfig } from '@/lib/siteConfig'

const STORAGE_KEY = 'hom_welcome_shown'

export function WelcomePopup() {
  const [open, setOpen] = useState(false)
  const content = getWelcomePopupConfig()

  useEffect(() => {
    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Only show once per session
    if (sessionStorage.getItem(STORAGE_KEY)) return

    const timer = setTimeout(() => {
      setOpen(true)
      sessionStorage.setItem(STORAGE_KEY, '1')
    }, 4000) // 4s delay for better UX

    return () => clearTimeout(timer)
  }, [])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-60"
          style={{ background: 'oklch(0 0 0 / 0.6)', backdropFilter: 'blur(4px)' }}
        />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-61 w-[90vw] max-w-md p-8 rounded-sm focus:outline-none"
          style={{
            background: 'oklch(0.14 0.03 210)',
            border: '1px solid oklch(1 0 0 / 0.12)',
            boxShadow: '0 16px 64px oklch(0 0 0 / 0.6)',
          }}
        >
          <Dialog.Close asChild>
            <button
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X size={18} weight="bold" />
            </button>
          </Dialog.Close>

          <div className="text-center space-y-4">
            <p
              className="text-xs tracking-[0.3em] uppercase"
              style={{ color: 'oklch(0.60 0.11 78)' }}
            >
              {content.eyebrow}
            </p>
            <Dialog.Title className="text-2xl tracking-[0.12em]">
              {content.title}
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground leading-relaxed">
              {content.description}
            </Dialog.Description>
            <NewsletterSignup className="mt-4" source="welcome-popup" />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
