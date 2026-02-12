import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { OrnamentalBorder, OrnamentalDivider } from '@/components/OrnamentalBorder'
import { EnvelopeSimple, InstagramLogo, MapPin } from '@phosphor-icons/react'

export function ContactSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="contact" className="py-20 lg:py-32" ref={ref}>
      <div className="container mx-auto px-6 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-4xl lg:text-5xl text-center mb-4 tracking-[0.15em]">Contact</h2>
          <OrnamentalDivider />

          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <OrnamentalBorder className="bg-card/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="space-y-6 text-center"
              >
                <h3 className="text-2xl tracking-[0.15em] text-accent">CONTACT US</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3 justify-center">
                    <EnvelopeSimple size={24} weight="fill" className="text-accent mt-1" />
                    <div className="text-left">
                      <p className="text-sm tracking-widest text-muted-foreground mb-1">EMAIL</p>
                      <a
                        href="mailto:hello@houseofmornii.com"
                        className="hover:text-accent transition-colors"
                      >
                        hello@houseofmornii.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 justify-center">
                    <InstagramLogo size={24} weight="fill" className="text-accent mt-1" />
                    <div className="text-left">
                      <p className="text-sm tracking-widest text-muted-foreground mb-1">INSTAGRAM</p>
                      <a
                        href="https://instagram.com/houseofmornii"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-accent transition-colors"
                      >
                        @houseofmornii
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 justify-center">
                    <MapPin size={24} weight="fill" className="text-accent mt-1" />
                    <div className="text-left">
                      <p className="text-sm tracking-widest text-muted-foreground mb-1">LOCATION</p>
                      <p>By appointment only</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </OrnamentalBorder>

            <OrnamentalBorder className="bg-card/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="space-y-6 text-center flex flex-col justify-center h-full"
              >
                <h3 className="text-2xl tracking-[0.15em] text-accent">BRONZE FIILG SHOP</h3>
                
                <p className="text-base leading-relaxed text-muted-foreground">
                  Visit our exclusive boutique to experience the full collection and receive 
                  personalized styling consultations.
                </p>

                <div className="pt-4">
                  <Button
                    size="lg"
                    className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold tracking-widest w-full group"
                  >
                    <span className="group-hover:tracking-[0.2em] transition-all">
                      BOOK YOUR APPOINTMENT
                    </span>
                  </Button>
                </div>
              </motion.div>
            </OrnamentalBorder>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
