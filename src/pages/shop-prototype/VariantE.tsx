// PROTOTYPE variant E · Index: a text-led list with a large live preview of the Product under the pointer.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LoadMore, Photo, Price, TYPES, typeLabel, useTypeFilter, type ShopVariantProps } from './shared'

export function VariantE({ products, loading, sortKey, reverse, onSort, canLoadMore, loadingMore, onLoadMore }: ShopVariantProps) {
  const { type, setType, visible } = useTypeFilter(products)
  const [activeId, setActiveId] = useState<string | null>(null)
  const active = visible.find((p) => p.id === activeId) ?? visible[0]
  const byName = sortKey === 'TITLE'

  return (
    <div className="p-wrap">
      <div className="pe-head">
        <h1 className="p-display">
          The <em>index.</em>
        </h1>
        <div className="pe-filters" role="group" aria-label="Product type">
          {TYPES.map((t) => (
            <button key={t.key} type="button" aria-pressed={type === t.key} onClick={() => setType(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="pe-layout">
        <div>
          <div className="pe-cols">
            <span>No.</span>
            <button type="button" onClick={() => onSort('TITLE', byName && !reverse)} aria-label="Sort by name">
              Name {byName ? (reverse ? '↑' : '↓') : ''}
            </button>
            <span className="pe-type-col">Type</span>
            <span className="text-right">Price</span>
          </div>
          {loading ? (
            <p className="text-[var(--p-muted)]">Loading…</p>
          ) : (
            <ul className="pe-list">
              {visible.map((p, i) => (
                <li key={p.id}>
                  <Link
                    to={`/products/${p.handle}`}
                    className="pe-row"
                    data-active={active?.id === p.id}
                    data-sold-out={!p.availableForSale}
                    onMouseEnter={() => setActiveId(p.id)}
                    onFocus={() => setActiveId(p.id)}
                  >
                    <span className="pe-num">{String(i + 1).padStart(2, '0')}</span>
                    <Photo p={p} width={200} className="pe-thumb" />
                    <span className="p-display pe-name">{p.title}</span>
                    <span className="pe-type pe-type-col">{typeLabel(p)}</span>
                    <span className="pe-price">
                      <Price p={p} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <LoadMore ghost canLoadMore={canLoadMore} loadingMore={loadingMore} onLoadMore={onLoadMore} />
        </div>
        <aside className="pe-preview" aria-hidden="true">
          {active && (
            <>
              <Photo p={active} width={1100} />
              <div className="pe-preview-meta">
                <p className="p-display text-[26px] leading-tight">{active.title}</p>
                <p className="text-[var(--p-muted)]">
                  <Price p={active} />
                </p>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
