import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { OrnamentalDivider } from '@/components/OrnamentalBorder'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

const collections = [
  {
    id: 'everyday',
    title: 'EVERYDAY',
    subtitle: 'Polished essentials',
    description: 'Refined, versatile pieces that elevate your daily elegance with timeless sophistication.',
    gradient: 'from-teal-deep/60 to-transparent',
  },
  {
    id: 'festive',
    title: 'FESTIVE',
    subtitle: 'Celebration shine',
    description: 'Radiant statement pieces designed to captivate and dazzle at every special occasion.',
    gradient: 'from-accent/40 to-transparent',
  },
  {
    id: 'bridal',
    title: 'BRIDAL',
    subtitle: 'Bridal grandeur',
    description: 'Exquisite heirloom-quality jewellery that transforms your most treasured moments into lasting memories.',
    gradient: 'from-gold/50 to-transparent',
  },
]

export function CollectionsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="collections" className="py-20 lg:py-32" ref={ref}>
      <div className="container mx-auto px-6 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl mb-4 tracking-[0.15em]">Collections</h2>
          <OrnamentalDivider />
          <p className="text-base lg:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Parisfall's eyeshadow palettes and eyeshadow sticks, embodying timeless luxury and modern artistry. 
            Each piece is thoughtfully crafted to honor heritage while celebrating contemporary elegance.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {collections.map((collection, index) => (
            <motion.div
              key={collection.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + index * 0.15, duration: 0.8 }}
            >
              <Card className="group relative overflow-hidden border-2 border-border hover:border-accent transition-all duration-500 bg-card cursor-pointer h-full">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <div
                    className={`absolute inset-0 bg-gradient-to-b ${collection.gradient} opacity-80 group-hover:opacity-60 transition-opacity duration-500`}
                  />
                  
                  <div
                    className="absolute inset-0 bg-cover bg-center transform group-hover:scale-110 transition-transform duration-700"
                    style={{
                      backgroundImage: `radial-gradient(circle at ${index % 2 === 0 ? '30%' : '70%'} 40%, oklch(0.45 0.08 210) 0%, oklch(0.25 0.03 210) 50%, oklch(0.15 0.02 210) 100%)`,
                    }}
                  />

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 rounded-full border-2 border-accent/30 group-hover:border-accent/60 transition-all duration-500 group-hover:scale-110" />
                  </div>
                </div>

                <div className="p-6 lg:p-8 border-t-2 border-border group-hover:border-accent transition-colors duration-500">
                  <h3 className="text-2xl lg:text-3xl mb-2 tracking-[0.2em] text-center group-hover:text-accent transition-colors">
                    {collection.title}
                  </h3>
                  <p className="text-sm tracking-[0.15em] text-accent text-center mb-4">
                    {collection.subtitle}
                  </p>
                  <p className="text-sm leading-relaxed text-center text-muted-foreground group-hover:text-foreground transition-colors">
                    {collection.description}
                  </p>
                </div>

                <div className="absolute top-4 left-4 right-4 bottom-4 border border-accent/0 group-hover:border-accent/30 transition-all duration-500 pointer-events-none" />
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
