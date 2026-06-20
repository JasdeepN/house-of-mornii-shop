// Shared animation constants for the luxury motion language
// Cubic-bezier: fast start, ultra-smooth deceleration — feels premium

export const luxuryEase = [0.16, 1, 0.3, 1] as [number, number, number, number]

// ─── Variants ────────────────────────────────────────────────────────────────

/** Fade up from below with blur clearing — the signature entrance */
export const fadeSlideUp = {
  hidden: { opacity: 0, y: 40, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.9, ease: luxuryEase },
  },
}

/** Parent container that staggers children */
export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      when: 'beforeChildren' as const,
    },
  },
}

/** Dynamic variant — pass custom={index} for index-based stagger */
export const staggerItem = {
  hidden: { opacity: 0, y: 30, filter: 'blur(4px)' },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { delay: i * 0.15, duration: 0.8, ease: luxuryEase },
  }),
}

/** Page enter/exit for AnimatePresence route transitions */
export const pageTransition = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

export const pageTransitionConfig = {
  duration: 0.4,
  ease: luxuryEase,
}

// ─── Viewport defaults ──────────────────────────────────────────────────────

/** Standard viewport options — animate once, slightly before entering */
export const viewportOnce = { once: true, margin: '-80px' as const }
