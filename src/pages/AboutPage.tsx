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
import {
  fadeSlideUp,
  staggerContainer,
  luxuryEase,
  viewportOnce,
} from '@/lib/animations'

const titleWords = ['About', 'House', 'of', 'Mornii']

const wordVariants = {
  hidden: { opacity: 0, y: 40, filter: 'blur(8px)' },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { delay: 0.15 + i * 0.15, duration: 0.9, ease: luxuryEase },
  }),
}

export function AboutPage() {
  return (
    <div className="min-h-screen pt-28 pb-16">
        <div className="container mx-auto px-6 lg:px-20">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: luxuryEase }}
            className="flex items-center gap-2 text-xs tracking-[0.2em] text-muted-foreground mb-10"
          >
            <Link to="/" className="hover:text-accent transition-colors">HOME</Link>
            <span>/</span>
            <span style={{ color: 'oklch(0.60 0.11 78)' }}>ABOUT</span>
          </motion.div>

          {/* Hero title — word-split blur reveal */}
          <div className="text-center mb-6">
            <h1 className="text-4xl lg:text-5xl xl:text-6xl tracking-[0.15em] flex flex-wrap items-center justify-center gap-x-4">
              {titleWords.map((word, i) => (
                <motion.span
                  key={word}
                  custom={i}
                  variants={wordVariants}
                  initial="hidden"
                  animate="visible"
                  className={word === 'Mornii' ? 'font-script text-5xl lg:text-6xl xl:text-7xl' : ''}
                  style={word === 'Mornii' ? { color: 'oklch(0.60 0.11 78)' } : undefined}
                >
                  {word}
                </motion.span>
              ))}
            </h1>
          </div>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.7, duration: 0.8, ease: luxuryEase }}
          >
            <OrnamentalDivider className="mb-12" />
          </motion.div>

          {/* Subtitle */}
          <motion.p
            variants={fadeSlideUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.5 }}
            className="text-center text-lg lg:text-xl leading-relaxed text-muted-foreground max-w-2xl mx-auto mb-16"
          >
            Where heritage-inspired opulence meets modern styling.
          </motion.p>

          {/* 3 content cards */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          >
            {/* Heritage */}
            <motion.div variants={fadeSlideUp}>
              <BaroqueCard animate={false}>
                <BaroqueCardHeader>
                  <BaroqueCardTitle className="text-xl">Our Heritage</BaroqueCardTitle>
                </BaroqueCardHeader>
                <BaroqueCardContent>
                  <p className="text-base leading-relaxed text-muted-foreground">
                    Our costume jewellery draws from the richness of cultural heritage,
                    reimagined with contemporary sophistication to create statement
                    pieces that transcend trends.
                  </p>
                </BaroqueCardContent>
              </BaroqueCard>
            </motion.div>

            {/* Philosophy */}
            <motion.div variants={fadeSlideUp}>
              <BaroqueCard animate={false}>
                <BaroqueCardHeader>
                  <BaroqueCardTitle className="text-xl">Our Philosophy</BaroqueCardTitle>
                </BaroqueCardHeader>
                <BaroqueCardContent>
                  <p className="text-base leading-relaxed text-muted-foreground">
                    Every piece is thoughtfully designed to celebrate life's moments—whether
                    it's the confidence of everyday elegance, the radiance of festive
                    celebrations, or the grandeur of bridal magnificence.
                  </p>
                </BaroqueCardContent>
              </BaroqueCard>
            </motion.div>

            {/* Promise */}
            <motion.div variants={fadeSlideUp}>
              <BaroqueCard animate={false}>
                <BaroqueCardHeader>
                  <BaroqueCardTitle className="text-xl">Our Promise</BaroqueCardTitle>
                </BaroqueCardHeader>
                <BaroqueCardContent>
                  <p className="text-base leading-relaxed text-muted-foreground">
                    Each creation becomes a cherished part of your personal story—crafted
                    to make you feel regal, radiant, and unmistakably modern.
                  </p>
                </BaroqueCardContent>
              </BaroqueCard>
            </motion.div>
          </motion.div>

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={viewportOnce}
            transition={{ delay: 0.3, duration: 1, ease: luxuryEase }}
            className="text-center mt-16"
          >
            <p
              className="text-lg tracking-[0.25em] font-semibold"
              style={{ color: 'oklch(0.60 0.11 78)' }}
            >
              REGAL · RADIANT · MODERN
            </p>
          </motion.div>
        </div>
      </div>
  )
}
