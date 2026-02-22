import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { CartFlyout } from '@/components/CartFlyout'
import { ScrollToHash } from '@/components/ScrollToHash'
import { PageTransition } from '@/components/PageTransition'
import { HomePage } from '@/pages/HomePage'
import { CollectionsPage } from '@/pages/CollectionsPage'
import { CollectionPage } from '@/pages/CollectionPage'
import { ProductPage } from '@/pages/ProductPage'
import { ShopPage } from '@/pages/ShopPage'
import { AboutPage } from '@/pages/AboutPage'
import { ContactPage } from '@/pages/ContactPage'
import { Toaster } from 'sonner'
import peacockTile from '@/assets/images/peacock-tile.webp'

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <PageTransition key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/collections/:handle" element={<CollectionPage />} />
          <Route path="/products/:handle" element={<ProductPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
      </PageTransition>
    </AnimatePresence>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div
        style={{
          backgroundColor: 'oklch(0.12 0.02 210)',
          backgroundImage: `
            radial-gradient(ellipse 120% 60% at 50% 0%,   oklch(0.15 0.03 210 / 0.92), transparent 70%),
            radial-gradient(ellipse 80%  40% at 20% 50%,  oklch(0.18 0.04 210 / 0.75), transparent 60%),
            radial-gradient(ellipse 80%  40% at 80% 50%,  oklch(0.18 0.04 210 / 0.75), transparent 60%),
            linear-gradient(180deg, oklch(0.12 0.02 210 / 0.70) 0%, oklch(0.10 0.02 210 / 0.55) 50%, oklch(0.12 0.02 210 / 0.70) 100%),
            url(${peacockTile})
          `,
          backgroundRepeat: 'no-repeat, no-repeat, no-repeat, no-repeat, repeat',
          backgroundSize: 'auto, auto, auto, auto, 380px 380px',
          backgroundAttachment: 'fixed, fixed, fixed, fixed, fixed',
        }}
      >
        <Header />
        <ScrollToHash />
        <main>
          <AnimatedRoutes />
        </main>
        <Footer />
        <CartFlyout />
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
