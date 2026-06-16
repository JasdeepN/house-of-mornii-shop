import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { CaretDown, Sparkle } from '@phosphor-icons/react'
import { OrnamentalBorder } from '@/components/OrnamentalBorder'
import { BrandLockup } from '@/components/BrandLockup'

const SCROLL_HIDE_THRESHOLD = 80 // px below which indicator is visible

const wordVariants = {
  hidden: { opacity: 0, y: 40, filter: 'blur(8px)' },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { delay: 0.2 + i * 0.18, duration: 0.9, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
}

export function HeroSection() {
  const [showScrollIndicator, setShowScrollIndicator] = useState(true)

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setShowScrollIndicator(window.scrollY < SCROLL_HIDE_THRESHOLD)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section className="relative min-h-screen flex flex-col items-center overflow-hidden pt-28 pb-12">

      {/* Content card — same glass style as all other cards */}
      <div className="relative z-10 w-full max-w-2xl px-6">
        <OrnamentalBorder
          contentClassName="p-8 md:p-12 lg:p-14"
          hoverable
        >
          <div className="flex flex-col items-center text-center gap-8">

            {/* Brand lockup */}
            <motion.div
              custom={0}
              variants={wordVariants}
              initial="hidden"
              animate="visible"
            >
              <BrandLockup size="xl" />
            </motion.div>

            {/* Tagline with flanking lines */}
            <motion.div
              custom={1}
              variants={wordVariants}
              initial="hidden"
              animate="visible"
              className="flex items-center gap-4 w-full max-w-sm"
            >
              <div className="flex-1 h-px hero-line-decorative" />
              <p
                className="text-[10px] tracking-[0.4em] uppercase whitespace-nowrap font-medium text-hero-tagline hero-text-glow"
              >
                Regal · Radiant · Modern
              </p>
              <div className="flex-1 h-px hero-line-decorative" />
            </motion.div>

            {/* Description */}
            <motion.p
              custom={2}
              variants={wordVariants}
              initial="hidden"
              animate="visible"
              className="text-base lg:text-lg leading-relaxed max-w-xl text-hero-description hero-text-glow"
            >
              Heritage-inspired costume jewellery crafted to elevate everyday elegance,
              festive radiance, and bridal grandeur.
            </motion.p>

            {/* CTA */}
            <motion.div
              custom={3}
              variants={wordVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col items-center gap-4 pt-2"
            >
              <Link to="/collections">
                <Button
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold tracking-[0.2em] text-sm px-10 py-6 group"
                >
                  <Sparkle size={16} weight="fill" className="mr-2 group-hover:animate-pulse" />
                  EXPLORE COLLECTIONS
                </Button>
              </Link>
              <Link
                to="/contact"
                className="text-xs tracking-[0.3em] uppercase transition-colors duration-300 hover:text-accent text-hero-subtle-link hero-text-glow"
              >
                or book a styling session
              </Link>
            </motion.div>

          </div>
        </OrnamentalBorder>
      </div>

      {/* Scroll indicator — fixed position, fades on scroll down */}
      <motion.div
        role="button"
        tabIndex={0}
        aria-label="Scroll to collections"
        onClick={() => {
          const el = document.getElementById('collections')
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' })
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            const el = document.getElementById('collections')
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' })
            }
          }
        }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-40 px-8 py-3 rounded-full cursor-pointer hero-scroll-indicator bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        initial={{ opacity: 0, y: 12 }}
        animate={{
          opacity: showScrollIndicator ? 1 : 0,
          y: showScrollIndicator ? 0 : 12
        }}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.35 }}
      >
        <span
          className="text-[9px] tracking-[0.4em] uppercase text-hero-scroll-text"
        >
          scroll
        </span>
        {showScrollIndicator && (
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          >
            <CaretDown size={16} className="hero-scroll-arrow" />
          </motion.div>
        )}
      </motion.div>
    </section>
  )
}
