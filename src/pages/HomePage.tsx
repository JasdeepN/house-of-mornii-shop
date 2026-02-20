import { HeroSection } from '@/components/HeroSection'
import { CollectionsSection } from '@/components/CollectionsSection'
import { AboutSection } from '@/components/AboutSection'
import { ContactSection } from '@/components/ContactSection'

export function HomePage() {
  return (
    <>
      <HeroSection />
      <CollectionsSection />
      <AboutSection />
      <ContactSection />
    </>
  )
}
