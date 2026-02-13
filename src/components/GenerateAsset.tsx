import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkle, Copy, Image as ImageIcon } from '@phosphor-icons/react'
import { toast } from 'sonner'

export function GenerateAsset() {
  const [prompt] = useState<string>(`Create a single high-resolution baroque/rococo ornate decorative border frame for "House of Mornii" luxury jewelry brand:

STYLE: 1700s French palace aesthetic with flowing organic curves, intricate corner flourishes where two parallel border lines elegantly tangle and intertwine. Bottom corners MORE elaborate and larger, top corners smaller and refined. Delicate filigree throughout. Peacock feather motifs subtly integrated.

COLORS (realistic metallic gold with depth):
- Highlight gold: #D4AF37
- Mid gold: #B8962A  
- Deep gold/bronze: #8B6F1E
- Shadow gold: #6B5416
- Teal accents: #2C5F6F
Use gradients/shading for 3D metallic appearance.

SPECS: Rectangular landscape, transparent PNG, 2048px+ wide, empty center for content framing.

AVOID: Flat colors, angular shapes, center medallions, modern elements, straight lines.`)

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt)
    toast.success('Prompt copied to clipboard!')
  }

  const handleOpenDallE = () => {
    window.open('https://chat.openai.com/', '_blank')
    toast.success('Opening ChatGPT - paste the prompt to generate with DALL-E 3')
  }

  const handleOpenMidjourney = () => {
    window.open('https://www.midjourney.com/', '_blank')
    toast.success('Opening Midjourney - paste the prompt to generate')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur p-4">
      <Card className="max-w-4xl w-full p-8 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Sparkle className="w-8 h-8 text-gold" weight="fill" />
            <h2 className="text-3xl font-bold text-gold">Baroque Border Asset Generator</h2>
          </div>
          <p className="text-muted-foreground">
            Copy this prompt and paste it into DALL-E 3 or Midjourney to create the ornate border
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-6 bg-muted/50 rounded-lg border border-gold/20 relative">
            <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed text-foreground/90">
{prompt}
            </pre>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleCopy}
              className="bg-gold hover:bg-gold-bright text-accent-foreground gap-2"
            >
              <Copy className="w-5 h-5" />
              Copy Prompt
            </Button>
            <Button 
              onClick={handleOpenDallE}
              variant="outline"
              className="border-gold/30 hover:bg-gold/10 gap-2"
            >
              <ImageIcon className="w-5 h-5" />
              Open ChatGPT (DALL-E 3)
            </Button>
            <Button 
              onClick={handleOpenMidjourney}
              variant="outline"
              className="border-gold/30 hover:bg-gold/10 gap-2"
            >
              <ImageIcon className="w-5 h-5" />
              Open Midjourney
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-6">
            <div className="p-4 bg-card border border-border rounded-md">
              <h3 className="font-semibold text-gold mb-2">Quick Start:</h3>
              <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
                <li>Click "Copy Prompt" above</li>
                <li>Click "Open ChatGPT" or "Open Midjourney"</li>
                <li>Paste the prompt into the chat</li>
                <li>Download the generated image</li>
              </ol>
            </div>
            <div className="p-4 bg-card border border-border rounded-md">
              <h3 className="font-semibold text-gold mb-2">After Generation:</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Save as high-res PNG with transparency</li>
                <li>• Place in <code className="text-xs bg-muted px-1 py-0.5 rounded">/src/assets/images/</code></li>
                <li>• Use in your components</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-teal-deep/20 border border-gold/20 rounded-md">
            <p className="text-sm text-gold-bright">
              <strong>Pro Tip:</strong> For DALL-E 3, you can also ask it to make variations or adjustments like "make the corners more ornate" or "add more peacock feather details"
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
