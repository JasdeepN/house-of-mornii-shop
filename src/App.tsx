import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ScrollToHash } from '@/components/ScrollToHash'
import { HomePage } from '@/pages/HomePage'
import { CollectionsPage } from '@/pages/CollectionsPage'
import { ProductPage } from '@/pages/ProductPage'
import { CartPage } from '@/pages/CartPage'
import peacockTile from '@/assets/images/peacock-tile.webp'

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
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/products/:handle" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
