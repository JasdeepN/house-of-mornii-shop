// PROTOTYPE, throwaway: five Shop All designs, switchable via ?variant=A-E on the existing /shop route.
// Question it answers: which page and card structure should Shop All use (structure, not colour)?
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PrototypeSwitcher } from '@/components/PrototypeSwitcher'
import type { ProductSummary } from '@/lib/shopify'
import type { ShopVariantProps } from './shared'
import { VariantA } from './VariantA'
import { VariantB } from './VariantB'
import { VariantC } from './VariantC'
import { VariantD } from './VariantD'
import { VariantE } from './VariantE'
import './prototype.css'

const VARIANTS = [
  { key: 'A', name: 'Editorial', summary: 'The brief as written: serif titles, whole photos, three columns', Component: VariantA },
  { key: 'B', name: 'Gallery wall', summary: 'Edge-to-edge grid, small labels; hover swaps the photo and offers quick add', Component: VariantB },
  { key: 'C', name: 'Sidebar shop', summary: 'Sticky filters, rounded cards, sale and sold-out badges, round + button', Component: VariantC },
  { key: 'D', name: 'Bento', summary: 'Mixed tile sizes: a featured design, wide tiles and Collection tiles', Component: VariantD },
  { key: 'E', name: 'Index', summary: 'Text-led list; the photo of the row under the pointer shows on the right', Component: VariantE },
]

export function ShopPrototype(props: Omit<ShopVariantProps, 'onQuickAdd'>) {
  const [params] = useSearchParams()
  const variant = VARIANTS.find((v) => v.key === params.get('variant')?.toUpperCase()) ?? VARIANTS[0]

  // Show the brief's champagne and teal palette across the whole page while prototyping.
  useEffect(() => {
    const body = document.body
    const previousTheme = body.getAttribute('data-theme')
    body.setAttribute('data-proto-palette', 'champagne')
    body.setAttribute('data-theme', 'light')
    return () => {
      body.removeAttribute('data-proto-palette')
      if (previousTheme) body.setAttribute('data-theme', previousTheme)
    }
  }, [])

  const onQuickAdd = (product: ProductSummary) =>
    toast(`Quick add: ${product.title}`, { description: 'Prototype control. Nothing was added to the Cart.' })

  return (
    <div className="proto-shop" data-variant={variant.key}>
      <variant.Component {...props} onQuickAdd={onQuickAdd} />
      <PrototypeSwitcher variants={VARIANTS.map(({ key, name, summary }) => ({ key, name, summary }))} />
    </div>
  )
}
