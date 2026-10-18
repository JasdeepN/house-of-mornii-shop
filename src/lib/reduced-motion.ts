import { MotionGlobalConfig } from 'framer-motion'

/**
 * Shoppers who ask their system to reduce motion get no fades or slides.
 * `MotionConfig reducedMotion="user"` only removes transforms; this also stops opacity animations.
 */
export function followReducedMotion(): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
  const query = window.matchMedia('(prefers-reduced-motion: reduce)')
  const apply = () => {
    MotionGlobalConfig.skipAnimations = query.matches
  }
  apply()
  query.addEventListener?.('change', apply)
  return () => query.removeEventListener?.('change', apply)
}
