import { motion } from 'framer-motion'
import { OrnamentalDivider } from '@/components/OrnamentalBorder'
import { JewelryImage } from '@/components/JewelryImage'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { 
  BaroqueCard, 
  BaroqueCardHeader, 
  BaroqueCardTitle, 
  BaroqueCardDescription,
  BaroqueCardContent
} from '@/components/BaroqueCard'
import { fadeSlideUp, viewportOnce } from '@/lib/animations'

// To use real photos: import them here and set the `image` field, e.g.:
// import everydayImg from '@/assets/images/collection-everyday.jpg'
// Then set image: everydayImg on the relevant collection object.
const collections = [
  {
    id: 'everyday' as const,
    title: 'EVERYDAY',
    subtitle: 'Polished essentials',
    description: 'Refined, versatile pieces that elevate your daily elegance with timeless sophistication.',
    image: null as string | null,
  },
  {
    id: 'festive' as const,
    title: 'FESTIVE',
    subtitle: 'Celebration shine',
    description: 'Radiant statement pieces designed to captivate and dazzle at every special occasion.',
    image: null as string | null,
  },
  {
    id: 'bridal' as const,
    title: 'BRIDAL',
    subtitle: 'Bridal grandeur',
    description: 'Exquisite heirloom-quality jewellery that transforms your most treasured moments into lasting memories.',
    image: null as string | null,
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
            Discover our curated jewellery collections, embodying timeless luxury and modern artistry.
            Each piece is thoughtfully crafted to honor heritage while celebrating contemporary elegance.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {collections.map((collection, index) => (
            <Link key={collection.id} to={`/collections/${collection.id}`} className="h-full block">
               <BaroqueCard 
                  className="h-full cursor-pointer"
                  animate
                  noBorder
                  hoverable
                  style={{ animationDelay: `${index * 150}ms` }}
               >
                  <BaroqueCardHeader withDivider={true}>
                    <BaroqueCardTitle className="text-xl md:text-2xl">{collection.title}</BaroqueCardTitle>
                    <BaroqueCardDescription>{collection.subtitle}</BaroqueCardDescription>
                  </BaroqueCardHeader>

                  <BaroqueCardContent className="flex flex-col gap-4">
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm mx-auto">
                      {collection.image ? (
                        <img
                          src={collection.image}
                          alt={collection.title}
                          className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                          loading="lazy"
                        />
                      ) : (
                        <JewelryImage collection={collection.id} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700" />
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {collection.description}
                    </p>
                  </BaroqueCardContent>
               </BaroqueCard>
            </Link>
          ))}
        </div>

        {/* View All link */}
        <motion.div
          variants={fadeSlideUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="text-center mt-10"
        >
          <Link
            to="/collections"
            className="text-xs tracking-[0.3em] uppercase transition-colors duration-300 hover:text-accent hover:underline underline-offset-4"
            style={{ color: 'oklch(0.75 0.05 78)' }}
          >
            VIEW ALL COLLECTIONS →
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
