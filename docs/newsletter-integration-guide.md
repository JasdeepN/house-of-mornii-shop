# Newsletter Integration Guide

**Ticket:** #26 — Docs: Newsletter integration and subscriber management guide

This guide covers how to wire the `NewsletterSignup.tsx` component to Klaviyo's Client API so subscribers are captured on form submission.

---

## Prerequisites

- Klaviyo account created (https://www.klaviyo.com/sign-up)
- Shopify → Klaviyo integration installed in Shopify App Store
- A Klaviyo **List** created (e.g. "Newsletter Subscribers" or "VIP Insiders")

---

## 1. Get Your Klaviyo Keys

### Public API Key (Company ID)

1. Klaviyo account → **Settings → API Keys**
2. Copy the **Public API Key** (labeled "Company ID") — this is safe to use in client-side code
3. Add to `.env.local`:
   ```ini
   VITE_KLAVIYO_COMPANY_ID=AbCdEf
   ```

### List ID

1. Klaviyo → **Lists & Segments** → click your newsletter list
2. The URL contains the list ID: `https://www.klaviyo.com/list/XXXXXX/members`
3. Add to `.env.local`:
   ```ini
   VITE_KLAVIYO_LIST_ID=XXXXXX
   ```

---

## 2. Add Env Var Types

Add to `src/vite-end.d.ts`:

```typescript
VITE_KLAVIYO_COMPANY_ID?: string
VITE_KLAVIYO_LIST_ID?: string
```

---

## 3. Wire the NewsletterSignup Component

Replace the placeholder `fetch` call in `src/components/NewsletterSignup.tsx`:

```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault()
  if (!email) return

  setStatus('loading')
  trackEvent('newsletter_signup', { email })

  const companyId = import.meta.env.VITE_KLAVIYO_COMPANY_ID
  const listId = import.meta.env.VITE_KLAVIYO_LIST_ID

  if (!companyId || !listId) {
    // Demo mode: simulate success
    await new Promise((r) => setTimeout(r, 800))
    setStatus('success')
    setEmail('')
    return
  }

  try {
    const res = await fetch(
      `https://a.klaviyo.com/client/subscriptions/?company_id=${companyId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', revision: '2024-10-15' },
        body: JSON.stringify({
          data: {
            type: 'subscription',
            attributes: {
              list_id: listId,
              email,
              consent_method: 'Form',
              consent_form_id: 'newsletter-footer-form',
              consent_form_version: 1,
            },
          },
        }),
      }
    )
    if (res.ok || res.status === 202) {
      setStatus('success')
      setEmail('')
    } else {
      setStatus('error')
    }
  } catch {
    setStatus('error')
  }
}
```

**Notes:**
- The Klaviyo client API returns `202 Accepted` on success (not 200)
- No server proxy is required — this endpoint accepts browser-originated CORS requests
- The `revision` header must match a supported Klaviyo API version; `2024-10-15` is stable

---

## 4. Test the Integration

1. Set `VITE_KLAVIYO_COMPANY_ID` and `VITE_KLAVIYO_LIST_ID` in `.env.local`
2. `npm run dev`
3. Fill in the newsletter form on the home page and click Subscribe
4. Check Klaviyo → **Lists & Segments** → your list → confirm the email appears
5. Check Klaviyo → **Activity feed** → should show a new `Subscribed to List` event

---

## 5. GitHub Secrets for Production

Add to GitHub repository secrets so the production build includes these values:

| Secret | Value |
|--------|-------|
| `VITE_KLAVIYO_COMPANY_ID` | Your Klaviyo public API key |
| `VITE_KLAVIYO_LIST_ID` | Your list ID |

Then add to the `Build` step env block in `.github/workflows/deploy.yml`:
```yaml
VITE_KLAVIYO_COMPANY_ID: ${{ secrets.VITE_KLAVIYO_COMPANY_ID }}
VITE_KLAVIYO_LIST_ID: ${{ secrets.VITE_KLAVIYO_LIST_ID }}
```

---

## 6. Klaviyo Welcome Flow Setup

After subscribers start flowing in, activate an automated welcome email:

1. Klaviyo → **Flows → Create Flow → Build your own**
2. **Flow trigger**: "Someone subscribes to a list" → select your newsletter list
3. Add:
   - **Time delay**: 0 minutes (send immediately)
   - **Email action**: Subject: "Welcome to House of Mornii — Your 10% Off Inside"
   - Body: Include the discount code + brand introduction + featured collection links
4. Activate the flow

---

## 7. Abandoned Cart Flow (Klaviyo + Shopify)

Requires the Shopify → Klaviyo integration to be active (tracks cart events):

1. Klaviyo → **Flows → Flow Library** → search "Abandoned Cart"
2. Use the Shopify pre-built template
3. Adjust timing: 1 hour after abandonment for the first email, 24 hours for the second
4. Customize subject lines and product display
5. Test with a real cart action on the dev store

---

## 8. Subscriber Management in Klaviyo

- **View subscribers**: Lists & Segments → your list → Members tab
- **Export CSV**: Lists & Segments → list → Export
- **Unsubscribe**: Klaviyo handles unsubscribes automatically; do NOT re-add unsubscribed users
- **GDPR compliance**: Klaviyo provides consent management and double opt-in settings (Settings → Email → Opt-in)
- **Suppression list**: Permanently suppressed/bounced emails are automatically excluded from sends

---

## 9. Alternative: Shopify Customer Subscription

If Klaviyo is not adopted, the simplest alternative is to use Shopify's Customer API:

1. In Shopify Admin → **Settings → Notifications → Customer email marketing**
2. Enable the newsletter checkbox at checkout
3. Or POST to Shopify Storefront API to create a customer with `acceptsMarketing: true`

This approach uses only Shopify with no third-party dependency but lacks advanced flow automation.

---

*See also:*
- [newsletter-provider-research.md](newsletter-provider-research.md) — provider selection rationale
- [deployment-runbook.md](deployment-runbook.md) — how to add secrets to CI
- Klaviyo Client API docs: https://developers.klaviyo.com/en/reference/subscribe_profiles
