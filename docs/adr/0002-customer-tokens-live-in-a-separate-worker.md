# Customer tokens live in a separate Worker

The storefront is a single-page app, but Customer Account API tokens never reach the browser. A dedicated `customer-session` Worker runs sign-in as a public client with PKCE, keeps each Customer session in KV behind an opaque HttpOnly cookie, and forwards the storefront's Customer Account API queries with the Customer's token added. It is separate from the Worker that holds the Admin API token. We chose this because Shopify's guidance is to keep these tokens out of browser storage, no source confirms the API accepts calls straight from a browser, and keeping the public sign-in routes away from the Admin token limits what a sign-in bug can reach.

## Considered Options

- Tokens in browser storage, with the single-page app as the public client: against Shopify's guidance, and it depends on browser API access that no source confirms.
- Adding sign-in to the existing Worker: puts public routes next to the Admin API token.
- A confidential client: Shopify's setup doesn't offer the Logout URI setting for confidential clients, and no doc says how sign-out would return to the storefront.
- Tokens encrypted into the cookie: avoids KV, but leaves little room in the cookie's size limit, and Shopify recommends server-side session storage.

## Consequences

- Checkout recognises a signed-in Customer through `sso=silent` on the checkout link. The Cart never carries a Customer token.
- Local sign-in work needs HTTPS on a registered hostname, so it runs through a Cloudflare Tunnel.
- KV writes take a minute or more to reach other locations. If Shopify rotates refresh tokens, token renewal has to tolerate a briefly stale session read.
