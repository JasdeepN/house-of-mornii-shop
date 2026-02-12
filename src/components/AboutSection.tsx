import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { OrnamentalBorder, OrnamentalDivider } from '@/components/OrnamentalBorder'

export function AboutSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="about" className="py-20 lg:py-32 bg-secondary/30" ref={ref}>
      <div className="container mx-auto px-6 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-4xl lg:text-5xl text-center mb-4 tracking-[0.15em]">About</h2>
          <OrnamentalDivider />

          <OrnamentalBorder className="bg-card/80 backdrop-blur-sm mt-12">
            <div className="space-y-6 text-center">
              <motion.p
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-lg lg:text-xl leading-relaxed"
              >
                House of Mornii is where heritage-inspired opulence meets modern styling.
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-base lg:text-lg leading-relaxed text-muted-foreground"
              >
                Every piece is thoughtfully designed to celebrate life's moments—whether it's the 
                confidence of everyday elegance, the radiance of festive celebrations, or the grandeur 
                of bridal magnificence.
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="text-base lg:text-lg leading-relaxed"
              >
                Our costume jewellery draws from the richness of cultural heritage, reimagined with 
                contemporary sophistication to create statement pieces that transcend trends and 
                become cherished parts of your personal story.
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.9, duration: 0.8 }}
                className="pt-6"
              >
                <p className="text-accent text-lg tracking-[0.2em] font-semibold">
                  REGAL · RADIANT · MODERN
                </p>
              </motion.div>
            </div>
          </OrnamentalBorder>
        </motion.div>
      </div>
    </section>
  )
}
