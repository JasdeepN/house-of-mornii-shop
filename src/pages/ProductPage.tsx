import { useParams } from 'react-router-dom'

export function ProductPage() {
  const { handle } = useParams()

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container mx-auto px-6 lg:px-20 text-center">
        <h1 className="text-4xl lg:text-5xl tracking-[0.15em] mb-4">Product</h1>
        <p className="text-muted-foreground text-lg">
          Viewing product: <span className="text-foreground">{handle}</span>
        </p>
      </div>
    </div>
  )
}
