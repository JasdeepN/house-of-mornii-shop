import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { EnvelopeSimple, InstagramLogo, MapPin } from '@phosphor-icons/react'
import { OrnamentalDivider } from '@/components/OrnamentalBorder'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import {
  fadeSlideUp,
  staggerContainer,
  staggerItem,
  luxuryEase,
  viewportOnce,
} from '@/lib/animations'
import { useSEO } from '@/hooks/useSEO'
import { FAQAccordion } from '@/components/FAQAccordion'
import { EnquiryForm } from '@/components/EnquiryForm'
import { getContactConfig, getEnquiryConfig } from '@/lib/siteConfig'

function getContactItems() {
  const contact = getContactConfig()

  return [
    { icon: EnvelopeSimple, label: 'EMAIL', value: contact.emailLabel, href: contact.emailHref },
    { icon: InstagramLogo, label: 'INSTAGRAM', value: contact.instagramHandle, href: contact.instagramUrl, external: true },
    { icon: MapPin, label: 'LOCATION', value: contact.locationLabel },
  ].filter((item) => item.value) as { icon: typeof EnvelopeSimple; label: string; value: string; href?: string; external?: boolean }[]
}

export function ContactPage() {
  const enquiryEnabled = getEnquiryConfig().enabled
  const { hash } = useLocation()
  const [stylingOpen, setStylingOpen] = useState(hash === '#styling')
  const contactItems = getContactItems()

  useEffect(() => {
    if (hash === '#styling') setStylingOpen(true)
  }, [hash])

  useSEO({
    title: 'Contact',
    description: 'Get in touch with House of Mornii. Book a styling appointment or reach out for enquiries about our heritage-inspired costume jewellery.',
  })

  return (
    <div className="min-h-screen pt-8 pb-16">
      <div className="container mx-auto px-6 lg:px-20">
        <PageBreadcrumb
          items={[{ label: 'HOME', to: '/' }, { label: 'CONTACT' }]}
          className="mb-10"
        />

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.3, ease: luxuryEase }}
          className="text-center mb-4"
        >
          <h1 className="text-4xl lg:text-5xl xl:text-6xl tracking-[0.15em]">Contact</h1>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.2, duration: 0.3, ease: luxuryEase }}
        >
          <OrnamentalDivider className="mb-12" />
        </motion.div>

        {/* Contact Info - Main Focus, No Card */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="max-w-3xl mx-auto mb-16"
        >
          <motion.div
            variants={fadeSlideUp}
            className="text-center mb-10"
          >
            <h2 className="text-2xl text-accent tracking-[0.15em] mb-8">GET IN TOUCH</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {contactItems.map((item, i) => (
              <motion.div
                key={item.label}
                custom={i}
                variants={staggerItem}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 rounded-full border border-border/50 bg-card/80 backdrop-blur-sm flex items-center justify-center golden-glow">
                  <item.icon size={24} weight="fill" className="text-accent" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs tracking-widest text-muted-foreground uppercase">{item.label}</p>
                  {item.href ? (
                    <a
                      href={item.href}
                      {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="flex min-h-11 max-w-full items-center justify-center text-sm [overflow-wrap:anywhere] hover:text-accent transition-colors"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-sm [overflow-wrap:anywhere]">{item.value}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Book a Styling Section */}
        <motion.div
          id="styling"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.3, ease: luxuryEase }}
          className="max-w-xl mx-auto text-center mb-20 scroll-mt-24"
        >
          <h2 className="text-2xl text-accent tracking-[0.15em] mb-6">BOOK A STYLING</h2>
          <p className="text-base leading-relaxed text-muted-foreground mb-8">
            Visit our exclusive boutique to experience the full collection and receive
            personalized styling consultations.
          </p>

          {enquiryEnabled && (
            <>
              <button
                type="button"
                aria-expanded={stylingOpen}
                aria-controls="styling-panel"
                onClick={() => setStylingOpen((open) => !open)}
                className="pill-btn pill-btn--cta w-full sm:w-auto justify-center px-12 py-4 text-sm inline-flex min-h-11"
              >
                BOOK YOUR APPOINTMENT
              </button>
              <div id="styling-panel" hidden={!stylingOpen} className="mt-8">
                {stylingOpen && (
                  <>
                    <p className="text-base leading-relaxed text-muted-foreground mb-6">
                      Tell us what you&apos;re looking for and when suits you.
                    </p>
                    <EnquiryForm kind="styling" />
                  </>
                )}
              </div>
            </>
          )}
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.3, ease: luxuryEase }}
          className="max-w-2xl mx-auto"
        >
          <h2 className="text-2xl tracking-[0.15em] text-center mb-6">Frequently Asked Questions</h2>
          <OrnamentalDivider className="mb-8" />
          <FAQAccordion />
        </motion.div>
      </div>
    </div>
  )
}
