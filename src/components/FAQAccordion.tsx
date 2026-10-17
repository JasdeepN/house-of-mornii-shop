import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'

const FAQ_ITEMS = [
  {
    question: 'What materials are used in your jewellery?',
    answer: 'Our costume jewellery is crafted from premium alloys with gold and silver plating, accented with crystals, semi-precious stones, and hand-set kundan work. Each piece is designed for lasting beauty.',
  },
  {
    question: 'How should I care for my pieces?',
    answer: 'Store your jewellery in a cool, dry place away from direct sunlight. Avoid contact with perfumes, lotions, and water. Gently wipe with a soft cloth after wearing to maintain their lustre.',
  },
  {
    question: 'Can I request a custom or bespoke piece?',
    answer: 'We love creating bespoke pieces for special occasions, especially bridal jewellery. Contact us to discuss your vision and we\'ll work together to bring it to life.',
  },
]

interface FAQAccordionProps {
  className?: string
}

export function FAQAccordion({ className }: FAQAccordionProps) {
  return (
    <Accordion type="single" collapsible className={className}>
      {FAQ_ITEMS.map((item, i) => (
        <AccordionItem
          key={i}
          value={`faq-${i}`}
        >
          <AccordionTrigger className="text-sm tracking-[0.08em]">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
