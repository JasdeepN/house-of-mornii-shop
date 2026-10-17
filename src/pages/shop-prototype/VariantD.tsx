// PROTOTYPE variant D · Bento: mixed tile sizes, a featured Product and Collection tiles woven into the grid.
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { ProductSummary } from '@/lib/shopify'
import { LoadMore, Photo, Price, TYPES, Tag, sized, useTypeFilter, type ShopCollection, type ShopVariantProps } from './shared'

type Tile =
  | { kind: 'product'; p: ProductSummary; size: 'feature' | 'wide' | 'normal' }
  | { kind: 'collection'; c: ShopCollection }

export function VariantD({ products, collections, loading, canLoadMore, loadingMore, onLoadMore }: ShopVariantProps) {
  const { type, setType, visible } = useTypeFilter(products)
  const tiles = useMemo(() => {
    const out: Tile[] = []
    const promos = collections.filter((c) => c.image)
    visible.forEach((p, i) => {
      out.push({ kind: 'product', p, size: i === 0 ? 'feature' : i % 7 === 5 ? 'wide' : 'normal' })
      if (type === 'all' && i === 4 && promos[0]) out.push({ kind: 'collection', c: promos[0] })
      if (type === 'all' && i === 11 && promos[1]) out.push({ kind: 'collection', c: promos[1] })
    })
    return out
  }, [visible, collections, type])

  return (
    <div className="p-wrap">
      <div className="pd-intro">
        <h1 className="p-display">
          Shop all <em>jewellery.</em>
        </h1>
        <p>Necklaces, earrings and sets with a sense of occasion. Start from a featured design or a collection.</p>
      </div>
      <div className="pd-chips" role="group" aria-label="Product type">
        {TYPES.map((t) => (
          <button key={t.key} type="button" aria-pressed={type === t.key} onClick={() => setType(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      {loading ? (
        <p className="text-[var(--p-muted)]">Loading…</p>
      ) : (
        <ul className="pd-grid">
          {tiles.map((t) =>
            t.kind === 'collection' ? (
              <li key={`c-${t.c.handle}`} className="pd-collection">
                <Link to={`/collections/${t.c.handle}`} className="pd-tile">
                  <div className="p-photo">
                    {t.c.image && <img src={sized(t.c.image.url, 700)} alt="" loading="lazy" />}
                  </div>
                  <div className="pd-collection-text">
                    <small>Collection</small>
                    <strong>{t.c.title}</strong>
                    {t.c.description && <span>{t.c.description}</span>}
                    <span className="pd-cta">Explore</span>
                  </div>
                </Link>
              </li>
            ) : (
              <li key={t.p.id} className={`pd-${t.size}`}>
                <Link to={`/products/${t.p.handle}`} className="pd-tile">
                  <Photo p={t.p} width={t.size === 'feature' ? 1100 : 700} />
                  <Tag p={t.p} />
                  <div className="pd-meta">
                    <h2 className="p-display pd-name">{t.p.title}</h2>
                    <p className="pd-price">
                      <Price p={t.p} soldOutText={false} />
                    </p>
                    {t.size !== 'normal' && <span className="pd-cta">Shop now</span>}
                  </div>
                </Link>
              </li>
            ),
          )}
        </ul>
      )}
      <LoadMore canLoadMore={canLoadMore} loadingMore={loadingMore} onLoadMore={onLoadMore} />
    </div>
  )
}
