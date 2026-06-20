import { motion } from 'framer-motion'
import { pageTransition, pageTransitionConfig } from '@/lib/animations'

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

/** Wrap every page in this for smooth enter/exit route transitions */
export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={pageTransition.initial}
      animate={pageTransition.animate}
      exit={pageTransition.exit}
      transition={pageTransitionConfig}
      className={className}
    >
      {children}
    </motion.div>
  )
}
