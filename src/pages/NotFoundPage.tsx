import { Link } from 'react-router-dom'
import { OrnamentalDivider } from '@/components/OrnamentalBorder'
import { useSEO } from '@/hooks/useSEO'

export function NotFoundPage() {
  useSEO({ title: 'Page not found', description: 'This page could not be found.', noindex: true })

  const linkClass = 'pill-btn pill-btn--cta min-h-11 w-full sm:w-auto justify-center px-10 py-3 text-sm inline-flex'

  return (
    <div className="min-h-screen pt-16 pb-16">
      <div className="container mx-auto px-6 lg:px-20 text-center">
        <h1 className="text-3xl lg:text-5xl tracking-[0.15em] break-words">Page not found</h1>
        <OrnamentalDivider className="my-10" />
        <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground">
          The page you were looking for has moved or does not exist. Browse the shop or head back home.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link to="/shop" className={linkClass}>SHOP</Link>
          <Link to="/" className={linkClass}>HOME</Link>
        </div>
      </div>
    </div>
  )
}
