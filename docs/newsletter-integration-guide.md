# Newsletter Integration Guide

**Ticket:** #26 — Docs: Newsletter integration and subscriber management guide

This guide describes the current prototype-safe newsletter architecture. The app keeps the signup UI working for demos while leaving the final email provider decision open.

---

## Current Direction

The site should not hardcode a newsletter provider, discount offer, or welcome-flow promise.

Current implementation goals:

1. Keep the frontend form usable for prototype showcases
2. Keep all visible signup copy configurable through environment variables
3. Keep a provider-neutral endpoint hook ready for future integration
4. Avoid promising discounts, early access, or other business offers until approved

---

## Environment Variables

Prototype/dev defaults live in `.env.development`. Production defaults live in `.env.production`. Override them in `.env.local`, GitHub Actions variables, or Cloudflare Pages environment variables when final business values are ready.

```ini
VITE_NEWSLETTER_ENDPOINT=
VITE_NEWSLETTER_EYEBROW=Join the House of Mornii list
VITE_NEWSLETTER_PLACEHOLDER=your@email.com
VITE_NEWSLETTER_CTA=Join
VITE_NEWSLETTER_LOADING_LABEL=Joining...
VITE_NEWSLETTER_SUCCESS_MESSAGE=Thank you. We will share updates as the collection opens.
VITE_NEWSLETTER_ERROR_MESSAGE=We could not save your email yet. Please try again.
VITE_WELCOME_POPUP_EYEBROW=Welcome
VITE_WELCOME_POPUP_TITLE=House of Mornii Preview
VITE_WELCOME_POPUP_DESCRIPTION=Join the list for collection previews and launch updates.
```

`VITE_NEWSLETTER_ENDPOINT` is intentionally blank for the prototype. When it is blank, the form shows success in prototype mode without writing to a real mailing list.

---

## Provider-Neutral Endpoint Contract

When the final email platform is selected, set `VITE_NEWSLETTER_ENDPOINT` to a relative or absolute endpoint that accepts this payload:

```json
{
  "email": "guest@example.com",
  "source": "newsletter-form"
}
```

Expected response behavior:

- `2xx`: treat as success
- Non-`2xx`: show the configured error message
- Network failure: show the configured error message

The `source` value identifies where the signup came from. Current sources:

- `newsletter-form`
- `welcome-popup`

---

## Current Frontend Flow

Files:

- [../src/components/NewsletterSignup.tsx](../src/components/NewsletterSignup.tsx)
- [../src/components/WelcomePopup.tsx](../src/components/WelcomePopup.tsx)
- [../src/lib/newsletter.ts](../src/lib/newsletter.ts)
- [../src/lib/siteConfig.ts](../src/lib/siteConfig.ts)

Behavior:

1. `NewsletterSignup` renders configurable copy from `getNewsletterConfig()`
2. On submit, it calls `subscribeToNewsletter({ email, source })`
3. If `VITE_NEWSLETTER_ENDPOINT` is blank, the helper returns prototype success
4. If `VITE_NEWSLETTER_ENDPOINT` is set, the helper posts `{ email, source }` to that endpoint
5. Success and error states remain visible and testable in both modes

---

## Optional Future Provider: Klaviyo

Klaviyo remains a strong future option for Shopify-native lifecycle email, but it is not required for the prototype.

If the business later chooses Klaviyo directly from the frontend, the implementation would need:

- Klaviyo account created
- Shopify to Klaviyo app installed
- Newsletter list created
- Klaviyo `Company ID`
- Klaviyo `List ID`
- Approved consent / opt-in settings
- Approved promotional wording, if any

If the business chooses a server or edge function, that function can translate the provider-neutral frontend payload into the provider-specific API call.

---

## Promotional Offers

Do not add a discount, early-access promise, gift, or any other offer to the UI until business explicitly approves:

- Exact wording
- Eligibility rules
- Expiration / validity
- Fulfillment mechanism
- Compliance / opt-in requirements

The prototype default is intentionally neutral: collection previews and launch updates.

---

## Testing

Run targeted newsletter tests:

```bash
npx vitest run src/lib/newsletter.test.ts src/components/NewsletterSignup.test.tsx
```

Run the production build before launch or deployment:

```bash
npm run build
```

---

## Later Production Activation Checklist

When the provider is selected:

1. Create or configure the provider account
2. Create the subscriber list / audience / segment
3. Implement or configure the endpoint behind `VITE_NEWSLETTER_ENDPOINT`
4. Add the endpoint variable to production build configuration
5. Submit a test email through the live site
6. Confirm the email appears in the provider dashboard
7. Confirm success/error states still behave correctly
8. Confirm analytics do not send raw email addresses

---

*See also:*

- [newsletter-provider-research.md](newsletter-provider-research.md) — future provider comparison
- [deployment-runbook.md](deployment-runbook.md) — deployment and environment setup
