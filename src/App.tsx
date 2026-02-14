import { Header } from '@/components/Header'
import { HeroSection } from '@/components/HeroSection'
import { CollectionsSection } from '@/components/CollectionsSection'
import { AboutSection } from '@/components/AboutSection'
import { ContactSection } from '@/components/ContactSection'
import { Footer } from '@/components/Footer'
import { BaroqueBorderShowcase } from '@/components/BaroqueBorderShowcase'
import { Toaster } from '@/components/ui/sonner'

function App() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <CollectionsSection />
        <AboutSection />
        <ContactSection />
      </main>
      <Footer />
      <BaroqueBorderShowcase />
      <Toaster />
    </>
  )
}

export default App