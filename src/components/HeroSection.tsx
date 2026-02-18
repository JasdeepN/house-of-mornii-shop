import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { OrnamentalDivider } from '@/components/OrnamentalBorder'
import { Sparkle, Crown } from '@phosphor-icons/react'
import { 
  BaroqueCard, 
  BaroqueCardContent,
  BaroqueCardHeader,
  BaroqueCardTitle
} from '@/components/BaroqueCard'

const moodCategories = [
  { label: 'EVERYDAY', subtitle: 'POLISHED' },
  { label: 'FESTIVE', subtitle: 'GLOW' },
  { label: 'BRIDAL', subtitle: 'HEIRLOOM' },
]

export function HeroSection() {
  const scrollToCollections = () => {
    const element = document.querySelector('#collections')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="relative min-h-screen pt-20">
      <div className="container mx-auto px-6 lg:px-20 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-160px)]">
          <motion.div
            initial={{ y: 30 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <BaroqueCard animate={false}> {/* We manage inner animations manually for stagger effect in this hero block */}
              <BaroqueCardContent className="space-y-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="text-sm tracking-[0.3em] text-muted-foreground"
                >
                  REGAL · RADIANT · MODERN
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                >
                  <h1 className="text-4xl lg:text-5xl font-bold tracking-wider mb-2">
                    HOUSE <span className="text-accent">OF</span>
                  </h1>
                  <div className="font-script text-6xl lg:text-7xl text-accent">Mornii</div>
                </motion.div>

                <OrnamentalDivider />

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="text-base lg:text-lg leading-relaxed max-w-md mx-auto"
                >
                  Statement costume jewellery inspired by heritage opulence—crafted to elevate
                  everyday moments, festive evenings, and bridal grandeur.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1, duration: 0.8 }}
                  className="flex flex-col md:flex-row md:flex-wrap gap-4 justify-center pt-4"
                >
                  <Button
                    size="lg"
                    className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold tracking-widest group"
                    onClick={scrollToCollections}
                  >
                    <Sparkle size={20} weight="fill" className="mr-2 group-hover:animate-pulse" />
                    EXPLORE COLLECTIONS
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-accent text-foreground hover:bg-accent/10 font-semibold tracking-widest"
                    onClick={scrollToCollections}
                  >
                    VIEW COUTURE LOOK
                  </Button>
                </motion.div>
              </BaroqueCardContent>
            </BaroqueCard>
          </motion.div>

          <motion.div
            initial={{ x: 30 }}
            animate={{ x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="space-y-6"
          >
            <BaroqueCard animate={false}>
               <BaroqueCardHeader withDivider={true}>
                 <div className="flex items-center justify-center gap-3">
                    <Crown size={28} weight="fill" className="text-accent" />
                    <BaroqueCardTitle>SHOP BY MOOD</BaroqueCardTitle>
                 </div>
               </BaroqueCardHeader>

               <BaroqueCardContent className="space-y-4">
                  {moodCategories.map((category, index) => (
                    <motion.button
                      key={category.label}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.2 + index * 0.1, duration: 0.6 }}
                      onClick={scrollToCollections}
                      className="w-full py-4 px-6 border border-border hover:border-accent bg-secondary/50 hover:bg-accent/10 transition-all duration-300 group rounded-xl"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg tracking-[0.2em] font-semibold">
                          {category.label}
                        </span>
                        <span className="text-sm tracking-[0.15em] text-muted-foreground group-hover:text-accent transition-colors">
                          {category.subtitle}
                        </span>
                      </div>
                    </motion.button>
                  ))}

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.6, duration: 0.8 }}
                    className="pt-4 border-t border-border"
                  >
                    <button
                      onClick={scrollToCollections}
                      className="text-accent tracking-[0.15em] text-sm hover:underline"
                    >
                      CURATED SETS
                      <br />
                      <span className="text-xs text-muted-foreground">SIGNATURE</span>
                    </button>
                  </motion.div>
               </BaroqueCardContent>
            </BaroqueCard>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
