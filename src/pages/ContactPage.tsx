import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { EnvelopeSimple, InstagramLogo, MapPin } from '@phosphor-icons/react'
import { OrnamentalDivider } from '@/components/OrnamentalBorder'
import {
  BaroqueCard,
  BaroqueCardHeader,
  BaroqueCardTitle,
  BaroqueCardContent,
  BaroqueCardFooter,
} from '@/components/BaroqueCard'
import {
  fadeSlideUp,
  staggerContainer,
  staggerItem,
  luxuryEase,
  viewportOnce,
} from '@/lib/animations'

const contactItems = [
  { icon: EnvelopeSimple, label: 'EMAIL', value: 'hello@houseofmornii.com', href: 'mailto:hello@houseofmornii.com' },
  { icon: InstagramLogo, label: 'INSTAGRAM', value: '@houseofmornii', href: 'https://instagram.com/houseofmornii', external: true },
  { icon: MapPin, label: 'LOCATION', value: 'By appointment only' },
] as { icon: typeof EnvelopeSimple; label: string; value: string; href?: string; external?: boolean }[]

export function ContactPage() {
  return (
    <div className="min-h-screen pt-28 pb-16">
        <div className="container mx-auto px-6 lg:px-20">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: luxuryEase }}
            className="flex items-center gap-2 text-xs tracking-[0.2em] text-muted-foreground mb-10"
          >
            <Link to="/" className="hover:text-accent transition-colors">HOME</Link>
            <span>/</span>
            <span style={{ color: 'oklch(0.60 0.11 78)' }}>CONTACT</span>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.9, ease: luxuryEase }}
            className="text-center mb-4"
          >
            <h1 className="text-4xl lg:text-5xl xl:text-6xl tracking-[0.15em]">Contact</h1>
          </motion.div>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.8, ease: luxuryEase }}
          >
            <OrnamentalDivider className="mb-12" />
          </motion.div>

          {/* 2-col cards */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
          >
            {/* Contact Info Card */}
            <motion.div variants={fadeSlideUp}>
              <BaroqueCard animate={false}>
                <BaroqueCardHeader withDivider={false}>
                  <BaroqueCardTitle className="text-2xl text-accent">GET IN TOUCH</BaroqueCardTitle>
                </BaroqueCardHeader>

                <BaroqueCardContent className="space-y-5">
                  {contactItems.map((item, i) => (
                    <motion.div
                      key={item.label}
                      custom={i}
                      variants={staggerItem}
                      initial="hidden"
                      whileInView="visible"
                      viewport={viewportOnce}
                      className="flex items-start gap-3 justify-center"
                    >
                      <item.icon size={24} weight="fill" className="text-accent mt-1" />
                      <div className="text-left">
                        <p className="text-sm tracking-widest text-muted-foreground mb-1">{item.label}</p>
                        {item.href ? (
                          <a
                            href={item.href}
                            {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                            className="hover:text-accent transition-colors"
                          >
                            {item.value}
                          </a>
                        ) : (
                          <p>{item.value}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </BaroqueCardContent>
              </BaroqueCard>
            </motion.div>

            {/* Book a Styling Card */}
            <motion.div variants={fadeSlideUp}>
              <BaroqueCard animate={false}>
                <BaroqueCardHeader withDivider={false}>
                  <BaroqueCardTitle className="text-2xl text-accent">BOOK A STYLING</BaroqueCardTitle>
                </BaroqueCardHeader>

                <BaroqueCardContent>
                  <p className="text-base leading-relaxed text-muted-foreground">
                    Visit our exclusive boutique to experience the full collection and receive
                    personalized styling consultations.
                  </p>
                </BaroqueCardContent>

                <BaroqueCardFooter centered>
                  <Button
                    size="lg"
                    className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold tracking-widest w-full group"
                  >
                    <span className="group-hover:tracking-[0.2em] transition-all">
                      BOOK YOUR APPOINTMENT
                    </span>
                  </Button>
                </BaroqueCardFooter>
              </BaroqueCard>
            </motion.div>
          </motion.div>
        </div>
      </div>
  )
}
