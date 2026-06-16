import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { luxuryEase } from '@/lib/animations'
import { absoluteSiteUrl } from '@/lib/siteConfig'
import { JsonLd, breadcrumbSchema } from '@/components/JsonLd'

export interface BreadcrumbItem {
  label: string
  to?: string
}

interface PageBreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
  centered?: boolean
}

export function PageBreadcrumb({ items, className = '', centered = false }: PageBreadcrumbProps) {
  // Generate breadcrumb structured data
  const breadcrumbData = breadcrumbSchema(
    items.map((item, i) => ({
      name: item.label,
      url: item.to ? absoluteSiteUrl(item.to) : '',
    })).filter((item) => item.url !== '')
  )

  return (
    <>
      <motion.nav
        aria-label="breadcrumb"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: luxuryEase }}
        className={`flex items-center gap-2 text-xs tracking-[0.2em] text-muted-foreground ${centered ? 'justify-center' : ''} ${className}`}
      >
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <span key={item.label} className="flex items-center gap-2">
              {i > 0 && <span>/</span>}
              {isLast ? (
                <span style={{ color: 'oklch(0.60 0.11 78)' }}>{item.label}</span>
              ) : item.to ? (
                <Link to={item.to} className="hover:text-accent transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span>{item.label}</span>
              )}
            </span>
          )
        })}
      </motion.nav>
      <JsonLd data={breadcrumbData} />
    </>
  )
}
