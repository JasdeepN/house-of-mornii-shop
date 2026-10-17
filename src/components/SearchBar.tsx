import { useState, useEffect, useCallback, type UIEvent } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import { MagnifyingGlass, X } from '@phosphor-icons/react'
import { useProductListing, formatDisplayPrice } from '@/lib/shopify'

const SEARCH_PAGE_SIZE = 24
const LOAD_MORE_THRESHOLD = 96

// ─── Search Query Sanitization ────────────────────────────────────────────────

const sanitizeSearchQuery = (query: string): string => {
  return query
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets to prevent injection
    .slice(0, 100) // Limit length to prevent abuse
}

interface SearchBarProps {
  onClose?: () => void
}

interface SearchResultsProps {
  onSelect: (handle: string) => void
  searchQuery: string
}

function SearchResults({ onSelect, searchQuery }: SearchResultsProps) {
  const { products, hasMore, isLoading, isLoadingMore, loadMore } = useProductListing({
    query: searchQuery,
    pageSize: SEARCH_PAGE_SIZE,
  })

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const { clientHeight, scrollHeight, scrollTop } = event.currentTarget

      if (scrollHeight - scrollTop - clientHeight <= LOAD_MORE_THRESHOLD) {
        loadMore()
      }
    },
    [loadMore],
  )

  const showEmpty = !isLoading && products.length === 0
  const showInitialLoading = isLoading
  const showLoadingMore = isLoadingMore

  return (
    <Command.List
      id="search-results"
      className="max-h-[50vh] overflow-y-auto p-2"
      aria-label="Search results"
      onScroll={handleScroll}
    >
      {showInitialLoading && (
        <div
          className="px-4 py-8 text-center text-sm text-muted-foreground tracking-wider"
          role="status"
        >
          Searching...
        </div>
      )}

      {showEmpty && (
        <Command.Empty className="px-4 py-8 text-center text-sm text-muted-foreground tracking-wider">
          No products found.
        </Command.Empty>
      )}

      {products.map((product) => (
        <Command.Item
          key={product.id}
          value={product.handle}
          onSelect={() => onSelect(product.handle)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-sm cursor-pointer transition-colors hover:bg-secondary data-[selected=true]:bg-secondary"
        >
          {product.featuredImage && (
            <img
              src={`${product.featuredImage.url}&width=80`}
              alt=""
              className="w-10 h-10 rounded-sm object-cover shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm tracking-wider truncate">{product.title}</p>
            <p className="text-xs tracking-wider text-muted-foreground">
              {formatDisplayPrice(product.price)}
            </p>
          </div>
        </Command.Item>
      ))}

      {showLoadingMore && (
        <div
          className="px-4 py-3 text-center text-xs text-muted-foreground tracking-widest"
          role="status"
        >
          Loading more results...
        </div>
      )}

      {hasMore && !isLoadingMore && (
        <div className="px-2 pt-2">
          <button
            type="button"
            onClick={loadMore}
            className="w-full rounded-sm border border-border px-3 py-2 text-xs tracking-widest text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            LOAD MORE RESULTS
          </button>
        </div>
      )}
    </Command.List>
  )
}

export function SearchBar({ onClose }: SearchBarProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [sanitizedQuery, setSanitizedQuery] = useState('')
  const navigate = useNavigate()

  const clearSearch = useCallback(() => {
    setOpen(false)
    setQuery('')
    setSanitizedQuery('')
    onClose?.()
  }, [onClose])

  const searchQuery = sanitizedQuery.length >= 2 ? sanitizedQuery : undefined

  const handleSelect = useCallback((handle: string) => {
    clearSearch()
    navigate(`/products/${handle}`)
  }, [clearSearch, navigate])

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') {
        clearSearch()
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [clearSearch])

  return (
    <>
      {/* Search trigger icon */}
      <button
        onClick={() => setOpen(true)}
        className="p-2 hover:text-accent transition-colors"
        aria-label="Search products (Ctrl+K)"
      >
        <MagnifyingGlass size={20} weight="bold" />
      </button>

      {/* Command palette overlay */}
      {open && createPortal(
        <div
          className="fixed inset-0 z-70 bg-foreground/40"
          style={{ backdropFilter: 'blur(4px)' }}
          onClick={clearSearch}
        >
          <div
            className="fixed top-[15vh] left-1/2 -translate-x-1/2 w-[90vw] max-w-lg rounded-sm overflow-hidden bg-card text-foreground border border-border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-expanded={open}
            aria-controls="search-results"
          >
            <Command shouldFilter={false}>
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <MagnifyingGlass size={18} className="text-muted-foreground" />
                <Command.Input
                  id="search-input"
                  value={query}
                  onValueChange={(value) => {
                    const sanitized = sanitizeSearchQuery(value)
                    setQuery(sanitized)
                    setSanitizedQuery(sanitized)
                  }}
                  placeholder="Search products..."
                  className="flex-1 bg-transparent outline-none text-sm tracking-wider placeholder:text-muted-foreground"
                  aria-label="Search products"
                  autoFocus
                />
                <button onClick={clearSearch} className="text-muted-foreground hover:text-foreground" aria-label="Close search">
                  <X size={16} weight="bold" />
                </button>
              </div>

              {searchQuery ? (
                <SearchResults searchQuery={searchQuery} onSelect={handleSelect} />
              ) : (
                <Command.List
                  id="search-results"
                  className="max-h-[50vh] overflow-y-auto p-2"
                  aria-label="Search results"
                >
                  {query.length > 0 && (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground tracking-wider">
                      Type at least 2 characters to search.
                    </div>
                  )}
                </Command.List>
              )}

              <div className="px-4 py-2 text-[10px] tracking-widest text-muted-foreground uppercase border-t border-border">
                <kbd className="px-1 py-0.5 rounded text-[10px] border border-border">Ctrl</kbd>
                {' + '}
                <kbd className="px-1 py-0.5 rounded text-[10px] border border-border">K</kbd>
                {' to toggle search'}
              </div>
            </Command>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
