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
    if (!content.enabled) return

    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Only show once per session
    if (sessionStorage.getItem(STORAGE_KEY)) return

    const timer = setTimeout(() => {
      setOpen(true)
      sessionStorage.setItem(STORAGE_KEY, '1')
    }, 4000) // 4s delay for better UX

    return () => clearTimeout(timer)
  }, [content.enabled])

  if (!content.enabled) return null

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-60 bg-foreground/40"
          style={{ backdropFilter: 'blur(4px)' }}
        />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-61 w-[90vw] max-w-md p-8 rounded-sm focus:outline-none bg-card text-foreground border border-border shadow-2xl"
        >
          <Dialog.Close asChild>
            <button
              className="absolute top-1 right-1 flex size-11 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X size={18} weight="bold" />
            </button>
          </Dialog.Close>

          <div className="text-center space-y-4">
            <p
              className="text-xs tracking-[0.3em] uppercase text-foreground"
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
