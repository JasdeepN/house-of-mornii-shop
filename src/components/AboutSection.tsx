import { useRef } from 'react'
import { 
  BaroqueCard, 
  BaroqueCardHeader, 
  BaroqueCardTitle, 
  BaroqueCardContent,
  BaroqueCardFooter
} from '@/components/BaroqueCard'

export function AboutSection() {
  const ref = useRef(null)

  return (
    <section id="about" className="py-12 lg:py-16 scroll-mt-20" ref={ref}>
      <div className="container mx-auto px-6 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <BaroqueCard animate>
            <BaroqueCardHeader>
              <BaroqueCardTitle>About</BaroqueCardTitle>
            </BaroqueCardHeader>

            <BaroqueCardContent className="space-y-6">
              <p className="text-lg lg:text-xl leading-relaxed">
                House of Mornii is where heritage-inspired opulence meets modern styling.
              </p>

              <p className="text-base lg:text-lg leading-relaxed text-muted-foreground">
                Every piece is thoughtfully designed to celebrate life's moments—whether it's the 
                confidence of everyday elegance, the radiance of festive celebrations, or the grandeur 
                of bridal magnificence.
              </p>

              <p className="text-base lg:text-lg leading-relaxed">
                Our costume jewellery draws from the richness of cultural heritage, reimagined with 
                contemporary sophistication to create statement pieces that transcend trends and 
                become cherished parts of your personal story.
              </p>
            </BaroqueCardContent>

            <BaroqueCardFooter centered>
              <p className="text-accent text-lg tracking-[0.2em] font-semibold">
                REGAL · RADIANT · MODERN
              </p>
            </BaroqueCardFooter>
          </BaroqueCard>
        </div>
      </div>
    </section>
  )
}
