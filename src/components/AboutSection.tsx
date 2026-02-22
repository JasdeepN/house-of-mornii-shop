import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { OrnamentalDivider } from '@/components/OrnamentalBorder'
import {
  BaroqueCard,
  BaroqueCardHeader,
  BaroqueCardTitle,
  BaroqueCardContent,
  BaroqueCardFooter,
} from '@/components/BaroqueCard'
import { fadeSlideUp, luxuryEase, viewportOnce } from '@/lib/animations'

export function AboutSection() {
  return (
    <section id="about" className="py-16 lg:py-24 scroll-mt-20">
      <div className="container mx-auto px-6 lg:px-20">
        <motion.div
          variants={fadeSlideUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="text-center mb-8"
        >
          <h2 className="text-4xl lg:text-5xl mb-4 tracking-[0.15em]">About</h2>
          <OrnamentalDivider />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40, filter: 'blur(4px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={viewportOnce}
          transition={{ delay: 0.15, duration: 0.9, ease: luxuryEase }}
          className="max-w-3xl mx-auto"
        >
          <BaroqueCard animate={false}>
            <BaroqueCardHeader withDivider={false}>
              <BaroqueCardTitle className="text-2xl">
                House of <span className="font-script text-3xl" style={{ color: 'oklch(0.60 0.11 78)' }}>Mornii</span>
              </BaroqueCardTitle>
            </BaroqueCardHeader>

            <BaroqueCardContent>
              <p className="text-base lg:text-lg leading-relaxed text-muted-foreground">
                Where heritage-inspired opulence meets modern styling. Every piece is
                thoughtfully crafted to celebrate life's moments—from everyday elegance
                to bridal grandeur.
              </p>
            </BaroqueCardContent>

            <BaroqueCardFooter centered className="flex flex-col items-center gap-4">
              <p
                className="text-sm tracking-[0.25em] font-semibold"
                style={{ color: 'oklch(0.60 0.11 78)' }}
              >
                REGAL · RADIANT · MODERN
              </p>
              <Link
                to="/about"
                className="text-xs tracking-[0.3em] uppercase transition-colors duration-300 hover:text-accent hover:underline underline-offset-4"
                style={{ color: 'oklch(0.75 0.05 78)' }}
              >
                DISCOVER OUR STORY →
              </Link>
            </BaroqueCardFooter>
          </BaroqueCard>
        </motion.div>
      </div>
    </section>
  )
}
