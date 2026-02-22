import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { CaretDown, Sparkle } from '@phosphor-icons/react'
import { OrnamentalBorder } from '@/components/OrnamentalBorder'
import { BrandLockup } from '@/components/BrandLockup'

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
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">

      {/* Content card — same glass style as all other cards */}
      <div className="relative z-10 w-full max-w-2xl px-6">
        <OrnamentalBorder contentClassName="p-8 md:p-12 lg:p-14">
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
              <div className="flex-1 h-px" style={{ background: 'oklch(0.60 0.08 78 / 0.40)' }} />
              <p
                className="text-[10px] tracking-[0.4em] uppercase whitespace-nowrap font-medium"
                style={{ color: 'oklch(0.80 0.07 78)' }}
              >
                Regal · Radiant · Modern
              </p>
              <div className="flex-1 h-px" style={{ background: 'oklch(0.60 0.08 78 / 0.40)' }} />
            </motion.div>

            {/* Description */}
            <motion.p
              custom={2}
              variants={wordVariants}
              initial="hidden"
              animate="visible"
              className="text-base lg:text-lg leading-relaxed max-w-xl"
              style={{ color: 'oklch(0.90 0.01 210)' }}
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
                className="text-xs tracking-[0.3em] uppercase transition-colors duration-300 hover:text-accent"
                style={{ color: 'oklch(0.75 0.05 78)' }}
              >
                or book a styling session
              </Link>
            </motion.div>

          </div>
        </OrnamentalBorder>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-10 px-8 py-3 rounded-full cursor-pointer"
        style={{
          background: 'oklch(0.10 0.02 210 / 0.60)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          border: '1px solid oklch(1 0 0 / 0.08)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileHover={{ background: 'oklch(0.16 0.03 210 / 0.75)', scale: 1.05 }}
        transition={{ delay: 2.0, duration: 1 }}
      >
        <span
          className="text-[9px] tracking-[0.4em] uppercase"
          style={{ color: 'oklch(0.72 0.05 78)' }}
        >
          scroll
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
        >
          <CaretDown size={16} style={{ color: 'oklch(0.65 0.10 78)' }} />
        </motion.div>
      </motion.div>
    </section>
  )
}
