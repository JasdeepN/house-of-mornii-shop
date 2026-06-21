// workers/shopify-proxy.ts — Cloudflare Worker for secure Admin API proxy
//
// This worker holds the Shopify Admin Access Token server-side and forwards
// authenticated requests to Shopify. The token never reaches the browser.
//
// Usage:
//   POST /api/shopify/admin  → Forward to Shopify Admin API
//   OPTIONS /api/shopify/admin → CORS preflight

interface ProxyRequest {
  query: string
  variables?: Record<string, unknown>
}

export default {
  async fetch(request: Request, env: { [key: string]: string }): Promise<Response> {
    // CORS handling
    const origin = request.headers.get('Origin') || '*'
    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400', // 24 hours preflight cache
    }

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      })
    }

    const adminToken = env.SHOPIFY_ADMIN_ACCESS_TOKEN
    if (!adminToken) {
      return new Response(
        JSON.stringify({ error: 'Admin token not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Only allow POST to /api/shopify/admin
    const url = new URL(request.url)
    if (url.pathname !== '/api/shopify/admin' || request.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Parse request body
    let body: ProxyRequest
    try {
      body = await request.json()
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    if (!body.query) {
      return new Response(
        JSON.stringify({ error: 'Missing query' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Forward to Shopify Admin API
    const API_VERSION = '2026-01'
    const shopifyDomain = env.SHOPIFY_STORE_DOMAIN || 'your-store.myshopify.com'
    const endpoint = `https://${shopifyDomain}/admin/api/${API_VERSION}/graphql.json`

    let response: Response
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': adminToken,
        },
        body: JSON.stringify({ query: body.query, variables: body.variables }),
      })
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Network request to Shopify failed', details: (error as Error).message }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const data = await response.json()

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    })
  },
}
