import { useCollections } from '@/lib/shopify'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { OrnamentalDivider } from '@/components/OrnamentalBorder'
import {
  BaroqueCard,
  BaroqueCardHeader,
  BaroqueCardTitle,
  BaroqueCardDescription,
  BaroqueCardContent,
} from '@/components/BaroqueCard'

export function CollectionsPage() {
  const { data: collections, isLoading, error } = useCollections()

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container mx-auto px-6 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl lg:text-5xl tracking-[0.15em] mb-4">
            Collections
          </h1>
          <OrnamentalDivider />
          <p className="text-base lg:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed mt-6">
            Explore our curated collections of regal costume jewellery.
          </p>
        </motion.div>

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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {collections.map((collection, index) => (
              <Link
                key={collection.id}
                to={`/collections/${collection.handle}`}
                className="block h-full"
              >
                <BaroqueCard
                  className="h-full cursor-pointer hover:-translate-y-2 transition-transform duration-500"
                  animate
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <BaroqueCardHeader withDivider>
                    <BaroqueCardTitle className="text-xl md:text-2xl">
                      {collection.title}
                    </BaroqueCardTitle>
                    {collection.description && (
                      <BaroqueCardDescription>
                        {collection.description}
                      </BaroqueCardDescription>
                    )}
                  </BaroqueCardHeader>

                  <BaroqueCardContent>
                    {collection.image ? (
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm mx-auto">
                        <img
                          src={`${collection.image.url}&width=600`}
                          alt={collection.image.altText || collection.title}
                          className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div
                        className="aspect-[4/3] w-full rounded-sm flex items-center justify-center"
                        style={{ background: 'oklch(0.20 0.03 210)' }}
                      >
                        <span className="text-muted-foreground text-sm tracking-widest uppercase">
                          {collection.title}
                        </span>
                      </div>
                    )}
                  </BaroqueCardContent>
                </BaroqueCard>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
