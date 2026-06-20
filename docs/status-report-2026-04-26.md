# Status Report - April 26, 2026

## Executive Summary

Work stopped after research and documentation, not in the middle of code implementation.

The latest completed commit was `a750802` on April 15, 2026:

- Newsletter provider research completed
- Newsletter integration guide completed
- Production domain / DNS / SSL research completed

The repository is currently clean, which means there is no partially implemented local work waiting to be resumed.

The direction has changed: the immediate goal is a polished prototype / showcase site with configurable placeholders. Final marketing integrations, email provider choice, promotional offers, and production content can be finalized later.

---

## What Was Completed

### Completed in Git

Latest commit:

- `a750802` - `docs: newsletter, domain DNS, and launch docs [#25 #26 #27]`

Files added in that work:

- [newsletter-provider-research.md](./newsletter-provider-research.md)
- [newsletter-integration-guide.md](./newsletter-integration-guide.md)
- [domain-dns-ssl-research.md](./domain-dns-ssl-research.md)

### Completed in Plane

These tickets are already done:

- `#25` Research: Newsletter provider selection
- `#26` Docs: Newsletter integration and subscriber management guide
- `#27` Research: Production domain DNS, SSL, and Cloudflare CDN configuration
- `#29` Docs: Production launch checklist and post-launch monitoring runbook

---

## What Is Not Completed Yet

### Newsletter Integration Is Prototype-Ready, Not Final

Ticket status:

- `#16` Connect newsletter signup to email marketing service - `In Progress`

Current frontend state:

- [../src/components/NewsletterSignup.tsx](../src/components/NewsletterSignup.tsx) now uses a provider-neutral helper with an optional `VITE_NEWSLETTER_ENDPOINT`
- [../src/components/WelcomePopup.tsx](../src/components/WelcomePopup.tsx) reuses `NewsletterSignup` and gets its visible copy from environment-driven site config
- If no endpoint is configured, the form runs in prototype mode so the site can be showcased without pretending a final email provider is active

Impact:

- Users can submit the form in the UI during demos
- No discount, offer, or email provider is promised by default
- A future endpoint can be connected without rewriting the UI

### Production Domain Cutover Is Still Not Implemented

Ticket status:

- `#28` Implement: Custom domain setup, SSL provisioning, and production Cloudflare Pages config - `Backlog`

Current state:

- Research and setup steps exist in [domain-dns-ssl-research.md](./domain-dns-ssl-research.md)
- The domain is owned by the business and the registrar is Cloudflare
- The actual Cloudflare Pages custom-domain / DNS / TLS cutover has not been executed yet

Impact:

- Production launch cannot be considered complete until domain, redirect, TLS, and final verification are done

---

## Business Inputs Required Later

The prototype can proceed without final business decisions. The inputs below are needed before production launch or before final integrations are activated.

### 1. Final Newsletter Platform Decision

Decision needed:

- Choose the final email / CRM platform when the business is ready
- Options remain open: Klaviyo, Shopify Email, Omnisend, Mailchimp, or a custom endpoint

Why this matters:

- The prototype now only needs a provider-neutral endpoint hook. A final platform decision is not required for showcase readiness.

### 2. Newsletter Endpoint Details

Required from business / marketing owner:

- Final newsletter provider account, if one is selected
- Final subscribe endpoint or platform-specific public identifiers
- Final success/error copy if the prototype placeholders should change

Why this matters:

- Engineering can keep the UI endpoint-ready now. A real subscriber write only begins after the final endpoint is supplied.

### 3. Promotional Offer Approval, If Any

Required from business / marketing owner:

- Decide whether there should be any launch incentive, discount, early-access promise, or other offer
- If there is an offer, provide exact wording, validity rules, redemption method, and fulfillment process
- If there is no offer, keep the neutral collection-preview language

Why this matters:

- The site should not promise discounts or perks until the business explicitly approves them.

### 4. Domain / DNS Ownership and Access

Required from business / operations owner:

- Confirm Cloudflare account access for the owned domain
- Provide access or coordinate a live cutover window
- Confirm canonical domain strategy: apex `houseofmornii.com` with `www` redirect

Why this matters:

- Ticket `#28` can proceed once Cloudflare access and a cutover window are available.

### 5. Launch Content, Legal, and Brand Assets

Required from business side:

- Final hero copy
- Final About copy
- Confirmed contact email
- Privacy Policy / Terms / Return Policy destinations
- OG image and favicon assets
- Final logo / brand lockup assets

Why this matters:

- Several launch checklist items are non-technical and must be finalized before production sign-off

### 6. Analytics Activation Values

Required from business / marketing owner:

- GA4 property and measurement ID
- Meta Pixel ID if Meta tracking is desired

Why this matters:

- The app is prepared to activate analytics, but the actual IDs still need to be supplied for production

---

## Concrete Next Steps

### Immediate Next Step 1 - Engineering Finishes Prototype Configuration

Owner: Engineering

Deliverables:

- Keep final site metadata, contact details, newsletter copy, and endpoint values environment-driven
- Keep dev placeholders in `.env.development`
- Keep production defaults in `.env.production` without promising final offers
- Ensure no hardcoded discount promise remains in UI or docs

Definition of done:

- `npm run build` passes
- Newsletter prototype tests pass
- Visible copy remains neutral unless env values override it

### Immediate Next Step 2 - Business Reviews Prototype Copy

Owner: Business / marketing

Deliverables:

- Review the neutral placeholder copy
- Decide whether current placeholder language is acceptable for showcase
- Defer email provider and promotional offer decisions until after prototype feedback

Output needed before engineering starts:

- Copy edits only if the neutral placeholders need adjustment

### Immediate Next Step 3 - Engineering Keeps Newsletter Endpoint Ready

Owner: Engineering

Deliverables:

- Keep [../src/components/NewsletterSignup.tsx](../src/components/NewsletterSignup.tsx) provider-neutral
- Keep endpoint wiring behind `VITE_NEWSLETTER_ENDPOINT`
- Use prototype mode while `VITE_NEWSLETTER_ENDPOINT` is blank
- Do not hardcode Klaviyo, discounts, or welcome offers

Definition of done:

- Prototype form works without a provider
- Endpoint mode can POST `{ email, source }` when the final endpoint exists
- Success and error states behave correctly

### Immediate Next Step 4 - Business Prepares Domain Cutover Access

Owner: Business / operations

Deliverables:

- Confirm registrar access
- Confirm Cloudflare access
- Confirm final canonical domain behavior
- Approve cutover timing

Output needed before engineering starts:

- Access path to domain management
- Approval to execute production DNS / SSL changes

### Immediate Next Step 5 - Engineering Executes Domain Cutover

Owner: Engineering

Deliverables:

- Complete ticket `#28`
- Add custom domains in Cloudflare Pages
- Update Cloudflare DNS records as needed
- Enable TLS and HTTPS enforcement
- Verify `www` redirect, canonical URL behavior, and production reachability

Definition of done:

- `https://houseofmornii.com` loads correctly
- `www` redirects to apex
- No TLS warnings
- Production deployment works on the final domain

### Immediate Next Step 6 - Business Completes Launch Inputs

Owner: Business

Deliverables:

- Final copy approval
- Final policy links
- Final asset package
- Final analytics IDs
- Final launch sign-off

Definition of done:

- Remaining checklist items in [production-launch-checklist.md](./production-launch-checklist.md) that are business-owned are complete

---

## Recommended Order of Operations

1. Engineering finalizes prototype-safe placeholders and endpoint hooks
2. Business reviews the prototype copy for showcase readiness
3. Business confirms Cloudflare access and domain cutover timing
4. Engineering executes production domain / SSL setup
5. Business finalizes final integrations, copy, legal links, brand assets, and analytics values
6. Engineering runs final build, tests, and launch verification

---

## Short Answer for Stakeholders

We are not blocked by missing engineering research.

The immediate goal is a prototype showcase with neutral, configurable placeholders.

The site should not promise a discount or hardcode a final email provider. Newsletter, contact, metadata, and endpoint values should stay environment-driven until the business finalizes them.

The domain is owned by the business and the registrar is Cloudflare. The remaining domain work is Cloudflare Pages custom-domain setup, DNS/TLS verification, and final launch validation.