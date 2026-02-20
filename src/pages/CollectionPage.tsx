import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCollection, flattenEdges } from '@/lib/shopify'
import { OrnamentalDivider } from '@/components/OrnamentalBorder'
import { ProductGrid } from '@/components/ProductGrid'
import { Button } from '@/components/ui/button'

export function CollectionPage() {
  const { handle } = useParams<{ handle: string }>()
  const { data: collection, isLoading, error } = useCollection(handle ?? '')

  if (isLoading) {
    return (
      <div className="min-h-screen pt-28 pb-16">
        <div className="container mx-auto px-6 lg:px-20 text-center py-20">
          <p className="text-muted-foreground tracking-widest animate-pulse">
            Loading collection...
          </p>
        </div>
      </div>
    )
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen pt-28 pb-16">
        <div className="container mx-auto px-6 lg:px-20 text-center py-20">
          <h1 className="text-4xl tracking-[0.15em] mb-4">Collection Not Found</h1>
          <p className="text-muted-foreground">
            This collection doesn't exist or couldn't be loaded.
          </p>
        </div>
      </div>
    )
  }

  const products = collection.products.edges.map((e) => e.node)
  const { hasNextPage, endCursor } = collection.products.pageInfo

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
            {collection.title}
          </h1>
          <OrnamentalDivider />
          {collection.description && (
            <p className="text-base lg:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed mt-6">
              {collection.description}
            </p>
          )}
        </motion.div>

        <ProductGrid products={products} />

        {hasNextPage && (
          <div className="text-center mt-12">
            <Button
              variant="outline"
              className="border-accent text-foreground hover:bg-accent/10 tracking-widest"
            >
              LOAD MORE
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
