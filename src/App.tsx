import { Header } from '@/components/Header'
import { HeroSection } from '@/components/HeroSection'
import { CollectionsSection } from '@/components/CollectionsSection'
import { AboutSection } from '@/components/AboutSection'
import { ContactSection } from '@/components/ContactSection'
import { Footer } from '@/components/Footer'
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
      <Toaster />
    </>
  )
}

export default App