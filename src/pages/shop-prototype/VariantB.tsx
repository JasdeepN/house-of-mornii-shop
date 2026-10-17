// PROTOTYPE variant B · Gallery wall: edge-to-edge hairline grid, small sans labels, photo swap and quick add on hover.
import { Link } from 'react-router-dom'
import { LoadMore, Photo, Price, SortSelect, TYPES, Tag, priceOf, useTypeFilter, type ShopVariantProps } from './shared'

export function VariantB({ products, loading, sortKey, reverse, onSort, onQuickAdd, canLoadMore, loadingMore, onLoadMore }: ShopVariantProps) {
  const { type, setType, counts, visible } = useTypeFilter(products)
  return (
    <>
      <div className="p-wrap pb-head">
        <div>
          <p className="pb-eyebrow">Shop</p>
          <h1 className="p-display pb-title">All jewellery</h1>
        </div>
        <p className="m-0 text-[var(--p-muted)]" aria-live="polite">{visible.length} products</p>
      </div>
      <div className="pb-bar">
        <div className="p-wrap pb-bar-row">
          <div className="pb-chips" role="group" aria-label="Product type">
            {TYPES.map((t) => (
              <button key={t.key} type="button" aria-pressed={type === t.key} onClick={() => setType(t.key)}>
                {t.label}
                <small>{counts[t.key]}</small>
              </button>
            ))}
          </div>
          <SortSelect sortKey={sortKey} reverse={reverse} onSort={onSort} label={false} />
        </div>
      </div>
      {loading ? (
        <p className="p-wrap text-[var(--p-muted)]">Loading…</p>
      ) : (
        <ul className="pb-grid">
          {visible.map((p) => {
            const soldOut = priceOf(p).soldOut
            return (
              <li key={p.id}>
                <div className="pb-media">
                  <Link to={`/products/${p.handle}`} tabIndex={-1} aria-hidden="true">
                    <Photo p={p} swap width={800} />
                  </Link>
                  <Tag p={p} />
                  <button type="button" className="pb-quick" disabled={soldOut} onClick={() => onQuickAdd(p)} aria-label={soldOut ? `${p.title} is sold out` : `Quick add ${p.title}`}>
                    <span className="pb-quick-label">{soldOut ? 'Sold out' : 'Quick add'}</span>
                    <span className="pb-quick-icon" aria-hidden="true">+</span>
                  </button>
                </div>
                <div className="pb-meta">
                  <h2 className="pb-name">
                    <Link to={`/products/${p.handle}`}>{p.title}</Link>
                  </h2>
                  <p className="pb-price">
                    <Price p={p} soldOutText={false} />
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <div className="p-wrap">
        <LoadMore ghost canLoadMore={canLoadMore} loadingMore={loadingMore} onLoadMore={onLoadMore} />
      </div>
    </>
  )
}
