import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Image as ImageIcon, CheckCircle, Info } from '@phosphor-icons/react'
import { useState } from 'react'

export function BaroqueBorderShowcase() {
  const [imageExists, setImageExists] = useState(false)

  const checkImage = () => {
    const img = new Image()
    img.onload = () => setImageExists(true)
    img.onerror = () => setImageExists(false)
    img.src = '/src/assets/images/baroque-border.png'
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md">
      <Card className="p-6 bg-card/95 backdrop-blur-md border-2 border-accent/40 shadow-2xl">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <ImageIcon className="w-6 h-6 text-accent flex-shrink-0 mt-1" weight="duotone" />
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gold mb-2">Baroque Border Ready!</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your beautiful baroque border image has been generated. Follow the instructions to integrate it into the project.
              </p>
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-2 text-sm">
              <div className="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5">
                1
              </div>
              <p className="text-foreground/90">
                Create folder: <code className="text-xs bg-background/50 px-1.5 py-0.5 rounded">/src/assets/images/</code>
              </p>
            </div>
            
            <div className="flex items-start gap-2 text-sm">
              <div className="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5">
                2
              </div>
              <p className="text-foreground/90">
                Save your border as: <code className="text-xs bg-background/50 px-1.5 py-0.5 rounded">baroque-border.png</code>
              </p>
            </div>
            
            <div className="flex items-start gap-2 text-sm">
              <div className="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5">
                3
              </div>
              <p className="text-foreground/90">
                Check the <code className="text-xs bg-background/50 px-1.5 py-0.5 rounded">BAROQUE_BORDER_INSTRUCTIONS.md</code> file
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={checkImage}
              variant="outline"
              size="sm"
              className="border-accent/30 hover:bg-accent/10 text-xs"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Check if Added
            </Button>
            
            {imageExists && (
              <div className="flex items-center gap-1 text-xs text-green-400">
                <CheckCircle className="w-4 h-4" weight="fill" />
                <span>Border Found!</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-border/50 flex items-start gap-2">
            <Info className="w-4 h-4 text-accent/60 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              The site is currently using SVG borders. Once you add the image, you can switch to the image-based border in the components.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
