import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { CartFlyout } from '@/components/CartFlyout'
import { ScrollToHash } from '@/components/ScrollToHash'
import { PageTransition } from '@/components/PageTransition'
import { Toaster } from 'sonner'
import { trackPageView } from '@/lib/analytics'
import { JsonLd, organizationSchema } from '@/components/JsonLd'
import { WelcomePopup } from '@/components/WelcomePopup'

// Route-level code splitting — each page loads on demand
const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })))
const ShopPage = lazy(() => import('@/pages/ShopPage').then((m) => ({ default: m.ShopPage })))
const CollectionsPage = lazy(() => import('@/pages/CollectionsPage').then((m) => ({ default: m.CollectionsPage })))
const CollectionPage = lazy(() => import('@/pages/CollectionPage').then((m) => ({ default: m.CollectionPage })))
const ProductPage = lazy(() => import('@/pages/ProductPage').then((m) => ({ default: m.ProductPage })))
const AboutPage = lazy(() => import('@/pages/AboutPage').then((m) => ({ default: m.AboutPage })))
const ContactPage = lazy(() => import('@/pages/ContactPage').then((m) => ({ default: m.ContactPage })))
const CartPage = lazy(() => import('@/pages/CartPage').then((m) => ({ default: m.CartPage })))

function RouteLoader() {
  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'oklch(0.60 0.11 78)', borderTopColor: 'transparent' }}
        />
        <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
          Loading...
        </span>
      </div>
    </div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()

  // Track page views on route change
  useEffect(() => {
    trackPageView(location.pathname, document.title)
  }, [location.pathname])

  return (
    <AnimatePresence mode="wait">
      <PageTransition key={location.pathname}>
        <Suspense fallback={<RouteLoader />}>
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/collections/:handle" element={<CollectionPage />} />
            <Route path="/products/:handle" element={<ProductPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/cart" element={<CartPage />} />
          </Routes>
        </Suspense>
      </PageTransition>
    </AnimatePresence>
  )
}

function App() {
  return (
    <BrowserRouter>
      <JsonLd data={organizationSchema()} />
      <div>
        <div className="relative" style={{ zIndex: 2 }}>
          <Header />
          <ScrollToHash />
          <main className="pt-24">
            <AnimatedRoutes />
          </main>
          <Footer />
        </div>
        <CartFlyout />
        <WelcomePopup />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'oklch(0.22 0.03 210)',
              border: '1px solid oklch(1 0 0 / 0.1)',
              color: 'oklch(0.90 0.01 210)',
            },
          }}
        />
      </div>
    </BrowserRouter>
  )
}

export default App
