import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Sparkle } from '@phosphor-icons/react'

export function GenerateAsset() {
  const [prompt, setPrompt] = useState<string>('')

  useEffect(() => {
    const generatePrompt = () => {
      const description = `Create a single high-resolution baroque/rococo ornate decorative border frame for "House of Mornii" luxury jewelry brand:

STYLE: 1700s French palace aesthetic with flowing organic curves, intricate corner flourishes where two parallel border lines elegantly tangle and intertwine. Bottom corners MORE elaborate and larger, top corners smaller and refined. Delicate filigree throughout. Peacock feather motifs subtly integrated.

COLORS (realistic metallic gold with depth):
- Highlight gold: #D4AF37
- Mid gold: #B8962A  
- Deep gold/bronze: #8B6F1E
- Shadow gold: #6B5416
- Teal accents: #2C5F6F
Use gradients/shading for 3D metallic appearance.

SPECS: Rectangular landscape, transparent PNG, 2048px+ wide, empty center for content framing.

AVOID: Flat colors, angular shapes, center medallions, modern elements, straight lines.`
      
      setPrompt(description)
    }
    
    generatePrompt()
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur p-4">
      <Card className="max-w-4xl w-full p-8 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Sparkle className="w-8 h-8 text-gold" weight="fill" />
            <h2 className="text-3xl font-bold text-gold">Ornate Border Asset Prompt</h2>
          </div>
          <p className="text-muted-foreground">
            Use this prompt with DALL-E, Midjourney, or another AI image generator to create the baroque border asset
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-6 bg-muted/50 rounded-lg border border-gold/20">
            <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
              {prompt}
            </pre>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-card border border-border rounded-md">
              <h3 className="font-semibold text-gold mb-2">Suggested Tools:</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• DALL-E 3 (ChatGPT Plus)</li>
                <li>• Midjourney</li>
                <li>• Stable Diffusion XL</li>
                <li>• Adobe Firefly</li>
              </ul>
            </div>
            <div className="p-4 bg-card border border-border rounded-md">
              <h3 className="font-semibold text-gold mb-2">Next Steps:</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Copy prompt above</li>
                <li>• Generate in AI tool</li>
                <li>• Save as PNG with transparency</li>
                <li>• Place in /src/assets/ornaments/</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
