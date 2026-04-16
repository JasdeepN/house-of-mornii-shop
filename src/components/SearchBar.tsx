import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import { MagnifyingGlass, X } from '@phosphor-icons/react'
import { useProducts } from '@/lib/shopify'
import { formatMoney } from '@/lib/shopify'

interface SearchBarProps {
  onClose?: () => void
}

export function SearchBar({ onClose }: SearchBarProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  // Fetch all products (demo-safe — they're already cached by React Query)
  const { data: productsData } = useProducts()

  const products = productsData?.edges.map((e) => e.node) ?? []

  // Filter locally by title
  const filtered = query.length >= 2
    ? products.filter((p) =>
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.tags?.some((t) => t.toLowerCase().includes(query.toLowerCase()))
      )
    : []

  const handleSelect = useCallback((handle: string) => {
    setOpen(false)
    setQuery('')
    onClose?.()
    navigate(`/products/${handle}`)
  }, [navigate, onClose])

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

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
      {open && (
        <div
          className="fixed inset-0 z-[70]"
          style={{ background: 'oklch(0 0 0 / 0.55)', backdropFilter: 'blur(4px)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="fixed top-[15vh] left-1/2 -translate-x-1/2 w-[90vw] max-w-lg rounded-sm overflow-hidden"
            style={{
              background: 'oklch(0.14 0.03 210)',
              border: '1px solid oklch(1 0 0 / 0.14)',
              boxShadow: '0 16px 64px oklch(0 0 0 / 0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Command shouldFilter={false}>
              <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid oklch(1 0 0 / 0.10)' }}>
                <MagnifyingGlass size={18} className="text-muted-foreground" />
                <Command.Input
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Search products..."
                  className="flex-1 bg-transparent outline-none text-sm tracking-wider placeholder:text-muted-foreground/50"
                  autoFocus
                />
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={16} weight="bold" />
                </button>
              </div>

              <Command.List className="max-h-[50vh] overflow-y-auto p-2">
                {query.length >= 2 && filtered.length === 0 && (
                  <Command.Empty className="px-4 py-8 text-center text-sm text-muted-foreground tracking-wider">
                    No products found.
                  </Command.Empty>
                )}

                {filtered.map((product) => (
                  <Command.Item
                    key={product.id}
                    value={product.handle}
                    onSelect={() => handleSelect(product.handle)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-sm cursor-pointer transition-colors hover:bg-white/5 data-[selected=true]:bg-white/5"
                  >
                    {product.featuredImage && (
                      <img
                        src={`${product.featuredImage.url}&width=80`}
                        alt=""
                        className="w-10 h-10 rounded-sm object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm tracking-wider truncate">{product.title}</p>
                      <p className="text-xs tracking-wider" style={{ color: 'oklch(0.60 0.11 78)' }}>
                        {formatMoney(product.priceRange.minVariantPrice)}
                      </p>
                    </div>
                  </Command.Item>
                ))}
              </Command.List>

              <div className="px-4 py-2 text-[10px] tracking-widest text-muted-foreground/50 uppercase" style={{ borderTop: '1px solid oklch(1 0 0 / 0.08)' }}>
                <kbd className="px-1 py-0.5 rounded text-[10px]" style={{ border: '1px solid oklch(1 0 0 / 0.15)' }}>Ctrl</kbd>
                {' + '}
                <kbd className="px-1 py-0.5 rounded text-[10px]" style={{ border: '1px solid oklch(1 0 0 / 0.15)' }}>K</kbd>
                {' to toggle search'}
              </div>
            </Command>
          </div>
        </div>
      )}
    </>
  )
}
