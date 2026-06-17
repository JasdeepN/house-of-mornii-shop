// Environment warning banner for non-production environments
// Displays when Shopify credentials are missing or running in limited mode

import { useEffect, useState } from 'react'
import { IS_CONFIGURED, STOREFRONT_MODE } from '@/lib/shopify'

export function EnvironmentWarning() {
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    // Show warning in dev or staging if not configured (demo mode)
    const isStaging = 
      typeof window !== 'undefined' && (
        window.location.hostname.includes('staging') ||
        window.location.hostname.includes('preview') ||
        window.location.hostname.includes('test')
      )
    
    if ((import.meta.env.DEV || isStaging) && STOREFRONT_MODE === 'demo') {
      setShowWarning(true)
    }
  }, [])

  if (!showWarning) return null

  return (
    <div className="bg-amber-500 text-white text-center py-2 text-sm px-4">
      <span className="font-medium">⚠ Shopify not configured</span>
      <span className="mx-2">—</span>
      <span>Running in demo mode with placeholder data.</span>
      <a
        href="https://github.com/home/home/projects/house-of-mornii-shop/blob/main/.env.example"
        target="_blank"
        rel="noopener noreferrer"
        className="underline ml-1 hover:text-amber-100"
      >
        Configure now
      </a>
    </div>
  )
}
