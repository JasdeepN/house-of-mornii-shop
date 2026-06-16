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
    <section id="contact" className="py-8 lg:py-12 scroll-mt-24">
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

            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))", 
              gap: "48px",
              justifyContent: "center",
              textAlign: "center" 
            }}>
              {contactItems.map((item) => (
                <div key={item.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                  <span style={{ 
                    width: "48px", 
                    height: "48px", 
                    borderRadius: "50%",
                    background: "var(--card)",
                    border: "1px solid var(--border)/50",
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center" 
                  }}>
                    <item.icon size={22} weight="fill" className="text-accent" />
                  </span>
                  <div style={{ minWidth: 0 }} className="space-y-1">
                    <p className="text-[10px] tracking-widest text-muted-foreground uppercase">{item.label}</p>
                    {item.href ? (
                      <a
                        href={item.href}
                        {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        className="hover:text-accent transition-colors text-sm block whitespace-nowrap overflow-hidden text-ellipsis max-w-full"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-sm whitespace-nowrap overflow-hidden text-ellipsis">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <BaroqueCardFooter centered>
              <Link to="/contact">
                <Button
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold tracking-widest group mt-8"
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
