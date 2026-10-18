# Newsletter Integration

## Overview

The newsletter system uses a provider-neutral architecture. The frontend form stays usable for prototype showcases while leaving the final email provider decision open. All visible signup copy is configurable through environment variables.

**Status:** the footer form is hidden at launch. It shows only when `VITE_NEWSLETTER_ENABLED=true` (default `false`), planned for v1.1. The component and helper stay in the codebase.

## Current Direction

1. Keep the frontend form usable for prototype showcases
2. Keep all visible signup copy configurable through environment variables
3. Keep a provider-neutral endpoint hook ready for future integration
4. Avoid promising discounts, early access, or other business offers until approved

## Environment Variables

Prototype/dev defaults live in `.env.development`. Production defaults live in `.env.production`. Override them in `.env.local`, GitHub Actions variables, or Cloudflare Pages environment variables.

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

`VITE_NEWSLETTER_ENDPOINT` is intentionally blank for the prototype. When blank, the form shows success in prototype mode without writing to a real mailing list.

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

The `source` value identifies where the signup came from:
- `newsletter-form`
- `welcome-popup`

## Frontend Flow

Files:
- `src/components/NewsletterSignup.tsx`
- `src/components/WelcomePopup.tsx`
- `src/lib/newsletter.ts`
- `src/lib/siteConfig.ts`

Behavior:
1. `NewsletterSignup` renders configurable copy from `getNewsletterConfig()`
2. On submit, it calls `subscribeToNewsletter({ email, source })`
3. If `VITE_NEWSLETTER_ENDPOINT` is blank, the helper returns prototype success
4. If `VITE_NEWSLETTER_ENDPOINT` is set, the helper posts `{ email, source }` to that endpoint
5. Success and error states remain visible and testable in both modes

## Provider Recommendation: Klaviyo

Klaviyo is the recommended future option for Shopify-native lifecycle email, but it is not required for the prototype.

| Dimension | Detail |
|---|---|
| Shopify integration | Native, real-time sync via Shopify app |
| Free tier | 500 contacts, 500 emails/month |
| Pricing | $20/mo (up to 500 active profiles + 5,000 emails/month) |
| Key features | Abandoned cart flows, back-in-stock alerts, post-purchase sequences, segmentation by purchase history |
| API | REST API + webhooks; embed signup forms in custom code |
| Cons | More expensive than alternatives at scale; dashboard has a learning curve |

**Second choice: Shopify Email** if the business owner prefers to minimize third-party tools and keep everything inside the Shopify admin.

### Future Klaviyo Integration

A future direct Klaviyo implementation would require:
1. Creating a Klaviyo list and getting the `List ID`
2. Including the Klaviyo `Company ID` (public key — safe to expose in client code)
3. POSTing to Klaviyo's Client API subscribe endpoint:
   ```
   POST https://a.klaviyo.com/client/subscriptions/?company_id=COMPANY_ID
   ```
4. No server-side proxy needed — Klaviyo's client API accepts CORS requests from the browser

## Promotional Offers

Do not add a discount, early-access promise, gift, or any other offer to the UI until business explicitly approves:
- Exact wording
- Eligibility rules
- Expiration / validity
- Fulfillment mechanism
- Compliance / opt-in requirements

The prototype default is intentionally neutral: collection previews and launch updates.

## Testing

```bash
npx vitest run src/lib/newsletter.test.ts src/components/NewsletterSignup.test.tsx
```

Run the production build before launch or deployment:
```bash
npm run build
```

## Production Activation Checklist

When the provider is selected:
1. Create or configure the provider account
2. Create the subscriber list / audience / segment
3. Implement or configure the endpoint behind `VITE_NEWSLETTER_ENDPOINT`
4. Add the endpoint variable to production build configuration
5. Submit a test email through the live site
6. Confirm the email appears in the provider dashboard
7. Confirm success/error states still behave correctly
8. Confirm analytics do not send raw email addresses
