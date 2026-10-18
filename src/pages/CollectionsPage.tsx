import { useCollections } from '@/lib/shopify'
import { motion } from 'framer-motion'
import { OrnamentalDivider } from '@/components/OrnamentalBorder'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { useSEO } from '@/hooks/useSEO'
import { fadeSlideUp, luxuryEase } from '@/lib/animations'
import { CollectionCard } from '@/components/CollectionCard'

export function CollectionsPage() {
  const { data: collections, isLoading, error } = useCollections()

  useSEO({
    title: 'Collections',
    description: 'Explore our curated collections of regal costume jewellery — everyday elegance, festive radiance, and bridal grandeur.',
  })

  return (
    <div className="min-h-screen pt-8 pb-16">
      <div className="container mx-auto px-6 lg:px-20">
        <PageBreadcrumb
          items={[{ label: 'HOME', to: '/' }, { label: 'COLLECTIONS' }]}
          className="mb-10"
        />

        {/* Hero title */}
        <div className="text-center mb-6">
          <h1 className="text-4xl lg:text-5xl xl:text-6xl tracking-[0.15em] flex flex-wrap items-center justify-center gap-x-4">
            Collections
          </h1>
        </div>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.4, ease: luxuryEase }}
        >
          <OrnamentalDivider className="mb-12" />
        </motion.div>

        {/* Subtitle */}
        <motion.p
          variants={fadeSlideUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2, duration: 0.3, ease: luxuryEase }}
          className="text-center text-lg lg:text-xl leading-relaxed text-muted-foreground max-w-2xl mx-auto mb-16"
        >
          Explore our curated collections of regal costume jewellery.
        </motion.p>

        {isLoading && (
          <div className="text-center py-20">
            <p className="text-muted-foreground tracking-widest animate-pulse">
              Loading collections...
            </p>
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">
              Unable to load collections. Please try again later.
            </p>
          </div>
        )}

        {collections && (
          <div className="grid grid-cols-3 gap-[22px] max-[1100px]:grid-cols-2 max-[760px]:gap-3">
            {collections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
