# Catalog reads use the Storefront API only

The storefront reads Products and Collections through the Storefront API, with the public Storefront token. An earlier change added a second path: the Catalog hooks could send Admin API queries through `POST /api/shopify/admin` on the automation Worker, behind `VITE_SHOPIFY_ADMIN_PROXY_ENABLED`. No build ever set that flag. We removed the route, the browser code that called it, and the flag. We kept the Admin token for the server-side jobs that need it: the daily backup and the webhook receiver.

## Considered Options

- Keep the Admin proxy as an option: it costs a second set of Catalog queries and a branch in every Catalog hook, and nothing exercises either. The route also forwards any read query with the Admin token, which can read Customers and Orders, to anyone who calls it.
- Restrict the proxy to an allowlist of Catalog queries: keeps a seam with one adapter that nothing uses.

## Consequences

- Catalog data is limited to what the Storefront API exposes to the public token.
- If the storefront ever needs Admin-only data, it gets a purpose-built Worker route that returns a fixed shape, never a GraphQL passthrough.
