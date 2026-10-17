// PROTOTYPE variant C · Sidebar shop: sticky filter sidebar, rounded cards, badges and a round quick-add button.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LoadMore, Photo, Price, SORTS, TYPES, Tag, priceOf, typeLabel, useTypeFilter, type ShopVariantProps } from './shared'

export function VariantC({ products, loading, sortKey, reverse, onSort, onQuickAdd, canLoadMore, loadingMore, onLoadMore }: ShopVariantProps) {
  const { type, setType, counts, visible } = useTypeFilter(products)
  const [hideSoldOut, setHideSoldOut] = useState(false)
  const shown = hideSoldOut ? visible.filter((p) => p.availableForSale) : visible

  return (
    <div className="p-wrap pc-layout">
      <aside className="pc-side" aria-label="Filters">
        <h1 className="p-display">Shop</h1>
        <div className="pc-group">
          <h2>Type</h2>
          {TYPES.map((t) => (
            <button key={t.key} type="button" className="pc-option" aria-pressed={type === t.key} onClick={() => setType(t.key)}>
              <span>{t.label}</span>
              <span className="pc-count">{counts[t.key]}</span>
            </button>
          ))}
        </div>
        <div className="pc-group">
          <h2>Availability</h2>
          <label className="pc-toggle">
            <input type="checkbox" checked={hideSoldOut} onChange={(e) => setHideSoldOut(e.target.checked)} />
            Hide sold out
          </label>
        </div>
        <div className="pc-group">
          <h2>Sort</h2>
          {SORTS.map((s) => (
            <button key={s.label} type="button" className="pc-option" aria-pressed={sortKey === s.key && reverse === s.reverse} onClick={() => onSort(s.key, s.reverse)}>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </aside>

      <section aria-label="Products">
        <h1 className="p-display pc-mobile-title" style={{ display: 'none' }}>Shop</h1>
        <div className="pc-rail" role="group" aria-label="Product type">
          {TYPES.map((t) => (
            <button key={t.key} type="button" aria-pressed={type === t.key} onClick={() => setType(t.key)}>
              {t.label} · {counts[t.key]}
            </button>
          ))}
        </div>
        <div className="pc-top">
          <span aria-live="polite">{shown.length} products</span>
        </div>
        {loading ? (
          <p className="text-[var(--p-muted)]">Loading…</p>
        ) : (
          <ul className="pc-grid">
            {shown.map((p) => {
              const soldOut = priceOf(p).soldOut
              return (
                <li key={p.id} className="pc-card">
                  <div className="pc-media">
                    <Photo p={p} swap />
                    <Tag p={p} />
                    <button type="button" className="pc-plus" disabled={soldOut} onClick={() => onQuickAdd(p)} aria-label={soldOut ? `${p.title} is sold out` : `Quick add ${p.title}`}>
                      +
                    </button>
                  </div>
                  <div className="pc-body">
                    <p className="pc-type">{typeLabel(p)}</p>
                    <h2 className="p-display pc-name">
                      <Link to={`/products/${p.handle}`}>{p.title}</Link>
                    </h2>
                    <p className="pc-price">
                      <Price p={p} soldOutText={false} />
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        <LoadMore canLoadMore={canLoadMore} loadingMore={loadingMore} onLoadMore={onLoadMore} />
      </section>
    </div>
  )
}
