// Environment warning banner for non-production environments
// Displays when Shopify credentials are missing

import { useEffect, useState } from 'react'
import { StorefrontMode, IS_CONFIGURED, STOREFRONT_MODE } from '@/lib/shopify'

export function EnvironmentWarning() {
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    // Show warning in dev/staging if not configured
    if (import.meta.env.DEV && !IS_CONFIGURED) {
      setShowWarning(true)
    }
  }, [])

  if (!showWarning) return null

  return (
    <div className="bg-amber-500 text-white text-center py-2 text-sm">
      ⚧ Shopify credentials not configured. Running in demo mode.
      <a href="#" className="underline ml-2">Configure now</a>
    </div>
  )
}
