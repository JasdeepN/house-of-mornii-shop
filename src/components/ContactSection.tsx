import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { OrnamentalDivider } from '@/components/OrnamentalBorder'
import { EnvelopeSimple, InstagramLogo, MapPin } from '@phosphor-icons/react'
import {
  BaroqueCard,
  BaroqueCardHeader,
  BaroqueCardTitle,
  BaroqueCardContent,
  BaroqueCardFooter,
} from '@/components/BaroqueCard'
import { fadeSlideUp, luxuryEase, viewportOnce } from '@/lib/animations'
import { getContactConfig } from '@/lib/siteConfig'

function getContactItems() {
  const contact = getContactConfig()

  return [
    { icon: EnvelopeSimple, label: 'EMAIL', value: contact.emailLabel, href: contact.emailHref },
    { icon: InstagramLogo, label: 'INSTAGRAM', value: contact.instagramHandle, href: contact.instagramUrl, external: true },
    { icon: MapPin, label: 'LOCATION', value: contact.locationLabel },
  ].filter((item) => item.value) as { icon: typeof EnvelopeSimple; label: string; value: string; href?: string; external?: boolean }[]
}

export function ContactSection() {
  const contactItems = getContactItems()

  return (
    <section id="contact" className="py-16 lg:py-24 scroll-mt-20">
      <div className="container mx-auto px-6 lg:px-20">
        <motion.div
          variants={fadeSlideUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="text-center mb-8"
        >
          <h2 className="text-4xl lg:text-5xl mb-4 tracking-[0.15em]">Contact</h2>
          <OrnamentalDivider />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40, filter: 'blur(4px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={viewportOnce}
          transition={{ delay: 0.15, duration: 0.9, ease: luxuryEase }}
          className="max-w-2xl mx-auto"
        >
          <BaroqueCard animate={false}>
            <BaroqueCardHeader withDivider={false}>
              <BaroqueCardTitle className="text-2xl text-accent">GET IN TOUCH</BaroqueCardTitle>
            </BaroqueCardHeader>

            <BaroqueCardContent className="space-y-4">
              {contactItems.map((item) => (
                <div key={item.label} className="flex items-start gap-3 justify-center">
                  <item.icon size={22} weight="fill" className="text-accent mt-0.5" />
                  <div className="text-left">
                    <p className="text-xs tracking-widest text-muted-foreground mb-0.5">{item.label}</p>
                    {item.href ? (
                      <a
                        href={item.href}
                        {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        className="hover:text-accent transition-colors text-sm"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-sm">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </BaroqueCardContent>

            <BaroqueCardFooter centered>
              <Link to="/contact">
                <Button
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold tracking-widest group"
                >
                  <span className="group-hover:tracking-[0.2em] transition-all">
                    GET IN TOUCH →
                  </span>
                </Button>
              </Link>
            </BaroqueCardFooter>
          </BaroqueCard>
        </motion.div>
      </div>
    </section>
  )
}
