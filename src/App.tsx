import { Header } from '@/components/Header'
import { HeroSection } from '@/components/HeroSection'
import { CollectionsSection } from '@/components/CollectionsSection'
import { AboutSection } from '@/components/AboutSection'
import { ContactSection } from '@/components/ContactSection'
import { Footer } from '@/components/Footer'

function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <CollectionsSection />
        <AboutSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  )
}

export default App