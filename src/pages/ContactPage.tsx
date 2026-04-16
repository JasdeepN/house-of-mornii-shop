import { motion } from 'framer-motion'
import { EnvelopeSimple, InstagramLogo, MapPin } from '@phosphor-icons/react'
import { OrnamentalDivider } from '@/components/OrnamentalBorder'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
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
import { useSEO } from '@/hooks/useSEO'
import { FAQAccordion } from '@/components/FAQAccordion'

const contactItems = [
  { icon: EnvelopeSimple, label: 'EMAIL', value: 'hello@houseofmornii.com', href: 'mailto:hello@houseofmornii.com' },
  { icon: InstagramLogo, label: 'INSTAGRAM', value: '@houseofmornii', href: 'https://instagram.com/houseofmornii', external: true },
  { icon: MapPin, label: 'LOCATION', value: 'By appointment only' },
] as { icon: typeof EnvelopeSimple; label: string; value: string; href?: string; external?: boolean }[]

export function ContactPage() {
  useSEO({
    title: 'Contact',
    description: 'Get in touch with House of Mornii. Book a styling appointment or reach out for enquiries about our heritage-inspired costume jewellery.',
  })

  return (
    <div className="min-h-screen pt-28 pb-16">
        <div className="container mx-auto px-6 lg:px-20">
          <PageBreadcrumb
            items={[{ label: 'HOME', to: '/' }, { label: 'CONTACT' }]}
            className="mb-10"
          />

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
                  <a
                    href="mailto:hello@houseofmornii.com?subject=Styling%20Appointment%20Request"
                    className="pill-btn pill-btn--cta w-full justify-center py-4 text-sm inline-flex"
                  >
                    BOOK YOUR APPOINTMENT
                  </a>
                </BaroqueCardFooter>
              </BaroqueCard>
            </motion.div>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.8, ease: luxuryEase }}
            className="max-w-2xl mx-auto mt-16"
          >
            <h2 className="text-2xl tracking-[0.15em] text-center mb-6">Frequently Asked Questions</h2>
            <OrnamentalDivider className="mb-8" />
            <FAQAccordion />
          </motion.div>
        </div>
      </div>
  )
}
