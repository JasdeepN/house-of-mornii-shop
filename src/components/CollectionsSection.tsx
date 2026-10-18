import { motion } from 'framer-motion'
import { OrnamentalDivider } from '@/components/OrnamentalBorder'
import { JewelryImage } from '@/components/JewelryImage'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { CollectionCard } from '@/components/CollectionCard'
import { fadeSlideUp, luxuryEase, viewportOnce } from '@/lib/animations'

// To use real photos: import them here and set the `image` field, e.g.:
// import everydayImg from '@/assets/images/collection-everyday.jpg'
// Then set image: everydayImg on the relevant collection object.
const collections = [
  {
    id: 'everyday' as const,
    handle: 'everyday',
    title: 'EVERYDAY',
    subtitle: 'Polished essentials',
    description: 'Refined, versatile pieces that elevate your daily elegance with timeless sophistication.',
    image: null as string | null,
  },
  {
    id: 'festive' as const,
    handle: 'festive',
    title: 'FESTIVE',
    subtitle: 'Celebration shine',
    description: 'Radiant statement pieces designed to captivate and dazzle at every special occasion.',
    image: null as string | null,
  },
  {
    id: 'bridal' as const,
    handle: 'bridal',
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
    <section id="collections" className="py-6 lg:py-8 scroll-mt-24" ref={ref}>
      <div className="container mx-auto px-6 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: luxuryEase }}
          className="text-center mb-8"
        >
          <h2 className="text-4xl lg:text-5xl mb-4 tracking-[0.15em]">Collections</h2>
          <OrnamentalDivider />
          <p className="text-base lg:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed mt-6">
            Discover our curated jewellery collections, embodying timeless luxury and modern artistry.
            Each piece is thoughtfully crafted to honor heritage while celebrating contemporary elegance.
          </p>
        </motion.div>

        <div className="grid grid-cols-3 gap-[22px] max-[1100px]:grid-cols-2 max-[760px]:gap-3">
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={{
                id: collection.id,
                handle: collection.handle,
                title: collection.title,
                description: collection.description,
                image: null,
              }}
              media={<JewelryImage collection={collection.id} className="h-full w-full object-cover" />}
            />
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
            className="inline-flex min-h-11 min-w-11 items-center justify-center text-xs tracking-[0.3em] uppercase text-primary underline-offset-4 transition-colors duration-300 hover:text-primary-hover hover:underline"
          >
            VIEW ALL COLLECTIONS →
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
