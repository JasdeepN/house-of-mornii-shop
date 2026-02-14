import { useKV } from '@github/spark/hooks'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

export function BorderToggle() {
  const [useImageBorder, setUseImageBorder] = useKV<boolean>('use-image-border', false)

  const handleToggle = (checked: boolean) => {
    setUseImageBorder(checked)
  }

  return (
    <Card className="fixed top-24 right-6 z-40 p-4 bg-card/95 backdrop-blur-md border border-accent/40">
      <div className="flex items-center gap-3">
        <Switch
          id="border-toggle"
          checked={useImageBorder}
          onCheckedChange={handleToggle}
        />
        <Label htmlFor="border-toggle" className="text-sm cursor-pointer">
          Use Baroque Border Image
        </Label>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {useImageBorder 
          ? 'Using image-based baroque border' 
          : 'Using SVG-based ornamental border'}
      </p>
    </Card>
  )
}
