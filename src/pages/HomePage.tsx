import { HeroSection } from '@/components/HeroSection'
import { CollectionsSection } from '@/components/CollectionsSection'
import { AboutSection } from '@/components/AboutSection'
import { ContactSection } from '@/components/ContactSection'
import { useSEO } from '@/hooks/useSEO'

export function HomePage() {
  useSEO()

  return (
    <>
      <HeroSection />
      <CollectionsSection />
      <AboutSection />
      <ContactSection />
    </>
  )
}
