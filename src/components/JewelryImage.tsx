import { useState, useEffect } from 'react'
import { Sparkle } from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'

interface JewelryImageProps {
  collection: 'everyday' | 'festive' | 'bridal'
  className?: string
}

const jewelryPrompts = {
  everyday: 'Generate a photorealistic image of elegant everyday costume jewelry for House of Mornii. The scene features: A delicate gold-toned layered necklace with subtle pearl accents, arranged artfully on luxurious deep teal velvet fabric. Soft natural lighting creates gentle highlights on the gold. The jewelry has a refined, understated elegance. Product photography style with shallow depth of field. Rich teal and antique gold color palette. Regal yet wearable aesthetic.',
  festive: 'Generate a photorealistic image of stunning festive costume jewelry for House of Mornii. The scene features: Ornate gold chandelier earrings with emerald green crystals and intricate peacock-inspired filigree motifs, displayed dramatically on rich teal silk fabric. Dramatic lighting with golden highlights creates an opulent glow. The jewelry is celebratory and eye-catching. Luxury product photography with deep shadows and bright highlights. Deep teal, emerald, and antique gold color palette. Regal opulence.',
  bridal: 'Generate a photorealistic image of exquisite bridal costume jewelry for House of Mornii. The scene features: An elaborate multi-tiered gold necklace with matching ornate earrings, featuring lustrous white pearls and detailed gold filigree work, arranged on deep teal velvet. Soft romantic lighting with a subtle glow. The jewelry evokes heirloom quality and timeless elegance. High-end bridal photography style with ethereal quality. Deep teal, pearl white, and antique gold color palette. Regal bridal grandeur.',
}

export function JewelryImage({ collection, className = '' }: JewelryImageProps) {
  const [generatedPrompt, setGeneratedPrompt] = useKV<string>(`jewelry-prompt-${collection}`, '')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const generatePrompt = async () => {
      if (generatedPrompt) {
        setLoading(false)
        return
      }

      try {
        const basePrompt = jewelryPrompts[collection]
        const promptText = `You are an expert at creating detailed image generation prompts for DALL-E or Midjourney. 

Take this jewelry photography description and enhance it into a detailed, vivid image generation prompt that will produce a stunning photorealistic result:

${basePrompt}

Add specific details about:
- Exact lighting setup (key light, fill light, rim light positions and qualities)
- Camera settings and lens choice for product photography
- Specific textures of the materials (velvet nap, metal sheen, pearl luster)
- Composition and framing
- Background elements that enhance the regal aesthetic
- Color grading and mood

Return ONLY the enhanced prompt text, no explanations or additional formatting. The prompt should be 3-4 sentences maximum but packed with visual details.`

        const enhancedPrompt = await window.spark.llm(promptText, 'gpt-4o')
        setGeneratedPrompt(enhancedPrompt.trim())
      } catch (error) {
        console.error('Error generating image prompt:', error)
        setError(true)
        setGeneratedPrompt(jewelryPrompts[collection])
      } finally {
        setLoading(false)
      }
    }

    generatePrompt()
  }, [collection, generatedPrompt, setGeneratedPrompt])

  return (
    <div className={`relative w-full h-full ${className}`}>
      {loading ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-teal-deep/40 to-background gap-4">
          <Sparkle size={48} weight="fill" className="text-accent animate-pulse" />
          <p className="text-sm text-accent tracking-wider">Crafting imagery...</p>
        </div>
      ) : (
        <div 
          className="w-full h-full bg-gradient-to-br from-teal-deep via-slate-dark to-background"
          style={{
            backgroundImage: collection === 'everyday' 
              ? 'radial-gradient(circle at 35% 40%, oklch(0.50 0.09 210) 0%, oklch(0.30 0.04 210) 40%, oklch(0.18 0.02 210) 100%)'
              : collection === 'festive'
              ? 'radial-gradient(circle at 65% 35%, oklch(0.60 0.11 78) 0%, oklch(0.45 0.08 210) 35%, oklch(0.20 0.02 210) 100%)'
              : 'radial-gradient(circle at 50% 45%, oklch(0.65 0.12 78) 0%, oklch(0.50 0.09 210) 30%, oklch(0.22 0.03 210) 100%)',
          }}
          title={generatedPrompt || jewelryPrompts[collection]}
          aria-label={generatedPrompt || jewelryPrompts[collection]}
        >
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="relative">
              {collection === 'everyday' && <EverydayJewelry />}
              {collection === 'festive' && <FestiveJewelry />}
              {collection === 'bridal' && <BridalJewelry />}
            </div>
          </div>
          
          {generatedPrompt && !error && (
            <div className="absolute bottom-4 left-4 right-4 p-4 bg-background/90 backdrop-blur-sm rounded-lg border border-accent/30">
              <p className="text-xs text-foreground/80 leading-relaxed">
                <span className="text-accent font-semibold tracking-wide block mb-1">AI Image Prompt Generated:</span>
                {generatedPrompt}
              </p>
              <p className="text-[10px] text-muted-foreground mt-2 italic">
                Copy this prompt to DALL-E, Midjourney, or your preferred AI image generator
              </p>
            </div>
          )}
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
