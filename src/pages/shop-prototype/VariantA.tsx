// PROTOTYPE variant A · Editorial: the brief as written (serif titles, whole photos, three columns).
import { Link } from 'react-router-dom'
import { LoadMore, Photo, Price, SortSelect, TYPES, useTypeFilter, type ShopVariantProps } from './shared'

export function VariantA({ products, loading, sortKey, reverse, onSort, canLoadMore, loadingMore, onLoadMore }: ShopVariantProps) {
  const { type, setType, visible } = useTypeFilter(products)
  return (
    <div className="p-wrap">
      <h1 className="p-display pa-title">
        Shop all <em>jewellery.</em>
      </h1>
      <div className="pa-tabs" role="tablist" aria-label="Product type">
        {TYPES.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={type === t.key} onClick={() => setType(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="pa-toolbar">
        <p className="m-0 text-[var(--p-muted)]" aria-live="polite">
          {visible.length} {visible.length === 1 ? 'product' : 'products'}
        </p>
        <SortSelect sortKey={sortKey} reverse={reverse} onSort={onSort} />
      </div>
      {loading ? (
        <p className="text-[var(--p-muted)]">Loading…</p>
      ) : (
        <ul className="pa-grid">
          {visible.map((p) => (
            <li key={p.id}>
              <Link to={`/products/${p.handle}`} className="pa-card">
                <Photo p={p} />
                <h2 className="p-display pa-name">{p.title}</h2>
                <p className="pa-price">
                  <Price p={p} />
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <LoadMore canLoadMore={canLoadMore} loadingMore={loadingMore} onLoadMore={onLoadMore} />
    </div>
  )
}
