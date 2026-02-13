import { useState, useEffect } from 'react'
import { Sparkle } from '@phosphor-icons/react'

interface JewelryImageProps {
  collection: 'everyday' | 'festive' | 'bridal'
  className?: string
}

const jewelryDescriptions = {
  everyday: 'An elegant costume jewelry piece for everyday wear - delicate gold-toned necklace with subtle pearl accents on a luxurious teal velvet display, photographed with soft natural lighting, refined and understated, product photography style',
  festive: 'Stunning festive costume jewelry - ornate gold chandelier earrings with emerald green crystals and intricate peacock motifs on rich teal silk, dramatic lighting with golden highlights, opulent and celebratory, luxury product photography',
  bridal: 'Exquisite bridal costume jewelry set - elaborate gold tiered necklace with matching earrings featuring white pearls and gold filigree work on deep teal velvet, soft romantic lighting, heirloom quality aesthetic, high-end bridal photography style',
}

export function JewelryImage({ collection, className = '' }: JewelryImageProps) {
  const [imageData, setImageData] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const generateImage = async () => {
      try {
        const promptText = `You are an AI assistant helping generate a detailed text description that will be used as alt text for a jewelry image. Based on this description: "${jewelryDescriptions[collection]}", provide a vivid, detailed description of the jewelry piece that would help visualize it. Focus on the colors (teal, gold), materials, design elements, and the regal peacock-inspired aesthetic. Return only the description text, no additional formatting.`
        
        const description = await window.spark.llm(promptText, 'gpt-4o-mini')
        setImageData(description)
      } catch (error) {
        console.error('Error generating image description:', error)
        setImageData(jewelryDescriptions[collection])
      } finally {
        setLoading(false)
      }
    }

    generateImage()
  }, [collection])

  return (
    <div className={`relative ${className}`}>
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-teal-deep/40 to-background">
          <Sparkle size={48} weight="fill" className="text-accent animate-pulse" />
        </div>
      ) : (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-teal-deep via-slate-dark to-background"
          style={{
            backgroundImage: collection === 'everyday' 
              ? 'radial-gradient(circle at 35% 40%, oklch(0.50 0.09 210) 0%, oklch(0.30 0.04 210) 40%, oklch(0.18 0.02 210) 100%)'
              : collection === 'festive'
              ? 'radial-gradient(circle at 65% 35%, oklch(0.60 0.11 78) 0%, oklch(0.45 0.08 210) 35%, oklch(0.20 0.02 210) 100%)'
              : 'radial-gradient(circle at 50% 45%, oklch(0.65 0.12 78) 0%, oklch(0.50 0.09 210) 30%, oklch(0.22 0.03 210) 100%)',
          }}
          title={imageData || jewelryDescriptions[collection]}
          aria-label={imageData || jewelryDescriptions[collection]}
        >
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="relative">
              {collection === 'everyday' && <EverydayJewelry />}
              {collection === 'festive' && <FestiveJewelry />}
              {collection === 'bridal' && <BridalJewelry />}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EverydayJewelry() {
  return (
    <svg width="200" height="240" viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="pearlGradient">
          <stop offset="0%" stopColor="#FFF8E7" stopOpacity="0.95" />
          <stop offset="70%" stopColor="#F4E7C3" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.85" />
        </radialGradient>
        <linearGradient id="chainGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C9A961" />
          <stop offset="50%" stopColor="#F4E7C3" />
          <stop offset="100%" stopColor="#A38B5F" />
        </linearGradient>
        <filter id="softGlow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <ellipse cx="100" cy="60" rx="60" ry="25" fill="oklch(0.45 0.08 210 / 0.3)" />
      
      <path
        d="M 70 50 Q 85 45 100 45 Q 115 45 130 50"
        stroke="url(#chainGold)"
        strokeWidth="3"
        fill="none"
        filter="url(#softGlow)"
      />
      
      <circle cx="100" cy="80" r="18" fill="url(#pearlGradient)" filter="url(#softGlow)" />
      <circle cx="100" cy="80" r="15" fill="#FFF8E7" opacity="0.7" />
      
      <circle cx="85" cy="95" r="12" fill="url(#pearlGradient)" opacity="0.9" filter="url(#softGlow)" />
      <circle cx="115" cy="95" r="12" fill="url(#pearlGradient)" opacity="0.9" filter="url(#softGlow)" />
      
      <circle cx="100" cy="110" r="10" fill="url(#pearlGradient)" opacity="0.85" filter="url(#softGlow)" />
    </svg>
  )
}

function FestiveJewelry() {
  return (
    <svg width="240" height="280" viewBox="0 0 240 280" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="emeraldGradient">
          <stop offset="0%" stopColor="#50C878" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#2D5F4C" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#1A3F2F" stopOpacity="0.85" />
        </radialGradient>
        <linearGradient id="festiveGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4AF37" />
          <stop offset="25%" stopColor="#F4E7C3" />
          <stop offset="75%" stopColor="#C9A961" />
          <stop offset="100%" stopColor="#8B7355" />
        </linearGradient>
        <filter id="jewelGlow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <ellipse cx="120" cy="60" rx="40" ry="20" fill="oklch(0.60 0.11 78 / 0.4)" />
      
      <path
        d="M 80 70 L 120 100 L 160 70"
        stroke="url(#festiveGold)"
        strokeWidth="4"
        fill="none"
        filter="url(#jewelGlow)"
      />
      
      <path
        d="M 120 100 L 95 140 L 120 180 L 145 140 Z"
        fill="url(#festiveGold)"
        stroke="#F4E7C3"
        strokeWidth="2"
        filter="url(#jewelGlow)"
      />
      
      <ellipse cx="120" cy="130" rx="25" ry="35" fill="url(#emeraldGradient)" filter="url(#jewelGlow)" />
      <ellipse cx="120" cy="130" rx="18" ry="28" fill="oklch(0.50 0.15 160)" opacity="0.7" />
      
      <circle cx="95" cy="140" r="8" fill="url(#emeraldGradient)" filter="url(#jewelGlow)" />
      <circle cx="145" cy="140" r="8" fill="url(#emeraldGradient)" filter="url(#jewelGlow)" />
      
      <path
        d="M 105 165 L 120 195 L 135 165"
        stroke="url(#festiveGold)"
        strokeWidth="3"
        fill="none"
      />
      <circle cx="120" cy="200" r="10" fill="url(#emeraldGradient)" filter="url(#jewelGlow)" />
    </svg>
  )
}

function BridalJewelry() {
  return (
    <svg width="260" height="300" viewBox="0 0 260 300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bridalPearl">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.98" />
          <stop offset="60%" stopColor="#FFF8E7" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#F4E7C3" stopOpacity="0.9" />
        </radialGradient>
        <linearGradient id="bridalGold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F4E7C3" />
          <stop offset="20%" stopColor="#D4AF37" />
          <stop offset="50%" stopColor="#F4E7C3" />
          <stop offset="80%" stopColor="#C9A961" />
          <stop offset="100%" stopColor="#8B7355" />
        </linearGradient>
        <filter id="bridalGlow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <ellipse cx="130" cy="60" rx="70" ry="30" fill="oklch(0.65 0.12 78 / 0.35)" />
      
      <path
        d="M 60 80 Q 95 70 130 70 Q 165 70 200 80"
        stroke="url(#bridalGold)"
        strokeWidth="4"
        fill="none"
        filter="url(#bridalGlow)"
      />
      
      <circle cx="130" cy="100" r="20" fill="url(#bridalPearl)" filter="url(#bridalGlow)" />
      <circle cx="130" cy="100" r="16" fill="#FFFFFF" opacity="0.8" />
      
      <circle cx="100" cy="120" r="16" fill="url(#bridalPearl)" filter="url(#bridalGlow)" />
      <circle cx="160" cy="120" r="16" fill="url(#bridalPearl)" filter="url(#bridalGlow)" />
      
      <path
        d="M 90 140 Q 110 135 130 140 Q 150 135 170 140"
        stroke="url(#bridalGold)"
        strokeWidth="3"
        fill="none"
        filter="url(#bridalGlow)"
      />
      
      <circle cx="80" cy="145" r="14" fill="url(#bridalPearl)" filter="url(#bridalGlow)" />
      <circle cx="130" cy="155" r="14" fill="url(#bridalPearl)" filter="url(#bridalGlow)" />
      <circle cx="180" cy="145" r="14" fill="url(#bridalPearl)" filter="url(#bridalGlow)" />
      
      <path
        d="M 100 170 L 130 190 L 160 170"
        stroke="url(#bridalGold)"
        strokeWidth="3.5"
        fill="none"
        filter="url(#bridalGlow)"
      />
      
      <circle cx="110" cy="190" r="12" fill="url(#bridalPearl)" filter="url(#bridalGlow)" />
      <circle cx="150" cy="190" r="12" fill="url(#bridalPearl)" filter="url(#bridalGlow)" />
      <circle cx="130" cy="205" r="15" fill="url(#bridalPearl)" filter="url(#bridalGlow)" />
      <circle cx="130" cy="205" r="12" fill="#FFFFFF" opacity="0.9" />
    </svg>
  )
}
