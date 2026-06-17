// Health check page for internal diagnostics
// Accessible at /_health route (admin-only in production)
// Displays storefront configuration status and API health

import { useEffect, useState } from 'react'
import { getHealthStatus, STOREFRONT_MODE, IS_CONFIGURED } from '@/lib/shopify'
import { formatMoney } from '@/lib/shopify'

interface HealthInfo {
  status: 'healthy' | 'degraded' | 'unhealthy'
  mode: typeof STOREFRONT_MODE
  configured: boolean
  timestamp: string
  apiVersion?: string
}

export function HealthPage() {
  const [health, setHealth] = useState<HealthInfo>(getHealthStatus())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate async health check
    const checkHealth = async () => {
      try {
        const status = getHealthStatus()
        setHealth({ ...status, apiVersion: '2026-01' })
      } catch (error) {
        setHealth({ ...health, status: 'unhealthy' })
      } finally {
        setIsLoading(false)
      }
    }

    checkHealth()
  }, [])

  const statusColor = {
    healthy: 'text-green-500',
    degraded: 'text-amber-500',
    unhealthy: 'text-red-500',
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <p className="text-muted-foreground">Loading health status...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-6 lg:px-20 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl tracking-[0.15em] mb-2">Storefront Health Status</h1>
          <p className="text-muted-foreground text-sm">
            Internal diagnostics page — not for public access
          </p>
        </div>

        <div className="glass-panel p-6 space-y-6">
          {/* Status Indicator */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <span className="text-sm tracking-widest uppercase text-muted-foreground">Overall Status</span>
            <span className={`text-xl font-semibold tracking-wider ${statusColor[health.status]}`}>
              {health.status.toUpperCase()}
            </span>
          </div>

          {/* Configuration Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">Storefront Mode</span>
              <span className="text-lg font-medium">{health.mode}</span>
            </div>
            <div>
              <span className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">Configured</span>
              <span className={`text-lg font-medium ${health.configured ? 'text-green-500' : 'text-red-500'}`}>
                {health.configured ? 'YES' : 'NO'}
              </span>
            </div>
            <div>
              <span className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">API Version</span>
              <span className="text-lg font-medium">{health.apiVersion || 'N/A'}</span>
            </div>
            <div>
              <span className="text-xs tracking-widest uppercase text-muted-foreground block mb-1">Last Checked</span>
              <span className="text-lg font-medium">{new Date(health.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Status Explanations */}
          <div className="pt-4 border-t border-white/10">
            <h3 className="text-sm tracking-widest uppercase text-muted-foreground mb-3">Status Definitions</h3>
            <dl className="space-y-2 text-sm">
              <dt className="font-medium">Healthy</dt>
              <dd className="text-muted-foreground ml-4">Storefront is properly configured with valid credentials and API is responding.</dd>
              
              <dt className="font-medium mt-2">Degraded</dt>
              <dd className="text-muted-foreground ml-4">Running in demo mode or tokenless mode. UI renders but checkout may not function.</dd>
              
              <dt className="font-medium mt-2">Unhealthy</dt>
              <dd className="text-muted-foreground ml-4">Critical configuration missing. Storefront cannot function commercially.</dd>
            </dl>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-white/10 flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm tracking-widest uppercase border border-white/20 hover:bg-white/10 transition-colors"
            >
              Refresh Status
            </button>
            <a
              href="/"
              className="px-4 py-2 text-sm tracking-widest uppercase bg-accent text-white hover:bg-accent/90 transition-colors"
            >
              Return to Store
            </a>
          </div>
        </div>

        {/* Debug Info */}
        <details className="mt-6">
          <summary className="text-xs tracking-widest uppercase text-muted-foreground cursor-pointer">
            Debug Information
          </summary>
          <pre className="mt-2 p-4 bg-black/30 rounded text-xs overflow-auto text-muted-foreground">
            {JSON.stringify({
              mode: STOREFRONT_MODE,
              configured: IS_CONFIGURED,
              health,
              env: {
                dev: import.meta.env.DEV,
                prod: import.meta.env.PROD,
                staging: import.meta.env.STAGING,
              },
            }, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  )
}

export default HealthPage
