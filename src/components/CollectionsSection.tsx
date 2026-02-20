import { motion } from 'framer-motion'
import { OrnamentalDivider } from '@/components/OrnamentalBorder'
import { JewelryImage } from '@/components/JewelryImage'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { 
  BaroqueCard, 
  BaroqueCardHeader, 
  BaroqueCardTitle, 
  BaroqueCardDescription,
  BaroqueCardContent
} from '@/components/BaroqueCard'

const collections = [
  {
    id: 'everyday' as const,
    title: 'EVERYDAY',
    subtitle: 'Polished essentials',
    description: 'Refined, versatile pieces that elevate your daily elegance with timeless sophistication.',
    gradient: 'from-teal-deep/60 to-transparent',
  },
  {
    id: 'festive' as const,
    title: 'FESTIVE',
    subtitle: 'Celebration shine',
    description: 'Radiant statement pieces designed to captivate and dazzle at every special occasion.',
    gradient: 'from-accent/40 to-transparent',
  },
  {
    id: 'bridal' as const,
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
    <section id="collections" className="py-12 lg:py-16 scroll-mt-20" ref={ref}>
      <div className="container mx-auto px-6 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <h2 className="text-4xl lg:text-5xl mb-4 tracking-[0.15em]">Collections</h2>
          <OrnamentalDivider />
          <p className="text-base lg:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed mt-6">
            Parisfall's eyeshadow palettes and eyeshadow sticks, embodying timeless luxury and modern artistry. 
            Each piece is thoughtfully crafted to honor heritage while celebrating contemporary elegance.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {collections.map((collection, index) => (
            <div key={collection.id} className="h-full">
               <BaroqueCard 
                  className="h-full cursor-pointer hover:-translate-y-2 transition-transform duration-500"
                  animate
                  style={{ animationDelay: `${index * 150}ms` }} // Simple staggering
               >
                  <BaroqueCardHeader withDivider={true}>
                    <BaroqueCardTitle className="text-xl md:text-2xl">{collection.title}</BaroqueCardTitle>
                    <BaroqueCardDescription>{collection.subtitle}</BaroqueCardDescription>
                  </BaroqueCardHeader>

                  <BaroqueCardContent className="flex flex-col gap-4">
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm mx-auto">
                        <JewelryImage collection={collection.id} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700" />
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {collection.description}
                    </p>
                  </BaroqueCardContent>
               </BaroqueCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
