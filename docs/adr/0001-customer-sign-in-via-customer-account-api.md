# Customer sign-in uses the Customer Account API

Customer sign-in was built on Shopify's legacy customer accounts, through the Storefront API's password-based customer mutations. Shopify deprecated legacy customer accounts in February 2026, stopped offering them to new stores, and directs headless storefronts to the Customer Account API. We are moving Customer sign-in to the Customer Account API in one release, at parity with today's Customer features, and investing nothing further in the legacy flow.

## Consequences

- Shopify hosts the sign-in page, which uses one-time email codes. Our sign-in, registration and password recovery modals go away, along with password reset and passwords themselves. A first sign-in with a new email creates the Customer.
- The Customer Account API updates only names and email marketing consent, so Customers change their email and phone on Shopify's hosted profile page.
- The store-wide switch to the new accounts (the Upgrade) can be reverted for 30 days, and not after.
