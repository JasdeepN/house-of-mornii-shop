// PROTOTYPE, throwaway: floating bar that cycles ?variant= on a prototype route.
// Rendered only in development builds and builds made with VITE_PROTOTYPES=true (the dev deploy).
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export interface PrototypeVariant {
  key: string
  name: string
  summary: string
}

export function PrototypeSwitcher({ variants }: { variants: PrototypeVariant[] }) {
  const [params, setParams] = useSearchParams()
  const current = Math.max(0, variants.findIndex((v) => v.key === params.get('variant')?.toUpperCase()))

  const go = (step: number) => {
    const next = variants[(current + step + variants.length) % variants.length]
    const updated = new URLSearchParams(params)
    updated.set('variant', next.key)
    setParams(updated, { replace: true })
    window.scrollTo({ top: 0 })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('input, textarea, select, [contenteditable="true"]') || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!import.meta.env.DEV && import.meta.env.VITE_PROTOTYPES !== 'true') return null
  const variant = variants[current]

  return (
    <div
      role="toolbar"
      aria-label="Prototype variants"
      className="fixed bottom-4 left-1/2 z-[200] flex w-max max-w-[calc(100vw-20px)] -translate-x-1/2 items-center gap-2 rounded-full bg-[#161616] px-2 py-2 text-[13px] text-white shadow-[0_10px_30px_rgba(0,0,0,.35)]"
      style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}
    >
      <button type="button" onClick={() => go(-1)} aria-label="Previous variant" className="h-9 w-9 rounded-full hover:bg-white/15">
        ◀
      </button>
      <div className="min-w-0 px-1 text-center" aria-live="polite">
        <div className="font-semibold">
          {variant.key} ({variant.name})
        </div>
        <div className="max-w-[440px] truncate text-[12px] text-white/70 max-[760px]:max-w-[220px]">{variant.summary}</div>
      </div>
      <button type="button" onClick={() => go(1)} aria-label="Next variant" className="h-9 w-9 rounded-full hover:bg-white/15">
        ▶
      </button>
    </div>
  )
}
