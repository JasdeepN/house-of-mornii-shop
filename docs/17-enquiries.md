# 17 - Enquiries

Shoppers send questions from the storefront by email, with no mail client and no address to copy. One form (`src/components/EnquiryForm.tsx`) serves two places:

| Place | Opens with | `kind` |
|-------|------------|--------|
| Product page | "Ask about this piece", a dialog. The request carries the Product's title, its path and the chosen Variant | `product` |
| Contact page | "Book your appointment", a disclosure. `/contact#styling` opens it on load | `styling` |

The form posts to the `enquiry` Worker (`workers/enquiry.ts`), routed at `/api/enquiry` on the storefront's own domain. The Worker emails one fixed address: `contact@houseofmornii.com` in production, the developer's inbox on dev.

The form renders only when `VITE_TURNSTILE_SITE_KEY` is set at build time (`getEnquiryConfig().enabled` in `src/lib/siteConfig.ts`). Without it there is no form and no placeholder.

## Request and responses

`POST /api/enquiry`, `Content-Type: application/json`, body at most 16 KB:

```json
{
  "kind": "product",
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "phone": "",
  "message": "Is this pendant available in gold?",
  "product": { "title": "Aria Pendant", "url": "/products/aria-pendant", "variant": "Gold" },
  "turnstileToken": "<from the widget>"
}
```

The Worker checks, in this order, and stops at the first failure:

1. The method is `POST` (anything else gets 405, which CI uses to tell that the Worker is live).
2. `Origin` equals `APP_ORIGIN` exactly.
3. The content type is JSON, and the body parses and fits.
4. Each field is valid: name 1–100 characters; a valid email of up to 254 characters; phone up to 30; message 10–2000; for `product`, a title and a same-origin URL.
5. The IP is under the rate limit: 5 per IP per 10 minutes, counted in the `RATE` KV namespace. KV is eventually consistent, so the cap is approximate. It is an abuse brake behind Turnstile, not a quota. A valid dry run skips it.
6. Turnstile's `siteverify` accepts the token.
7. Dry run (dev only, see [Testing](#testing)): answer without sending.
8. Send.

| Status | Body | Form shows |
|--------|------|------------|
| 200 | `{ok:true}` | "we've received your message and will reply by email" |
| 200 | `{ok:true,dryRun:true}` | The same; nothing was sent |
| 400 | `{error:'invalid',fields}` | Each field's message under its input |
| 403 | `{error:'forbidden'}` | Bad origin or failed Turnstile. The failure message, with a `mailto:` link to the contact address |
| 429 | `{error:'rate_limited'}` | Asks the Shopper to wait and try again |
| 502 | `{error:'send_failed'}` | The same failure message as a 403 |

After any failure the form resets the Turnstile widget, because a token is good for one check only. Sending before the widget has produced a token shows "Please wait a moment for the security check to finish, then send again." and sends nothing.

Every request logs one JSON line, `{"worker":"enquiry","outcome":"…","kind":"…"}`. The outcome is `sent`, `dry_run`, `invalid`, `bad_origin`, `turnstile_failed`, `rate_limited`, `send_failed`, and so on. It never logs the Shopper's details.

## The email

| Header | Value |
|--------|-------|
| From | `"House of Mornii website" <enquiries@notify.houseofmornii.com>` |
| To | `ENQUIRY_TO` |
| Reply-To | The Shopper's name and email, so replying answers them |
| Subject | `Enquiry: <Product title> (<name>)` or `Styling appointment request (<name>)` |

The plain-text body lists the type, name, email, phone, Product (title, full URL, Variant) and the message, then the time received in Toronto time.

The Worker sends with the Email Workers `send_email` binding (`EMAIL`). The binding can only send to its configured `destination_address`, and that address must be a verified destination in Email Routing. So a bug in the Worker cannot mail anyone else.

## Environments

`wrangler.enquiry.toml` configures nothing at the top level, so a deploy without `--env` cannot pick a destination.

| | dev | production |
|---|-----|------------|
| Worker | `enquiry-dev` | `enquiry-production` |
| Route | `dev.houseofmornii.com/api/enquiry` | `houseofmornii.com/api/enquiry` |
| `ENQUIRY_TO` and `destination_address` | `jasdeepn4@hotmail.com` | `contact@houseofmornii.com` |
| `RATE` KV namespace | `enquiry-rate-dev` | `enquiry-rate-production` |
| Turnstile | Cloudflare's always-pass test keys | A real widget for `houseofmornii.com` |
| Dry run | Enabled (`ENQUIRY_DRY_RUN_TOKEN` set) | Impossible (the token is never set) |

**Secrets and variables** (GitHub environments `dev` and `production`):

| Name | Kind | Where it goes |
|------|------|---------------|
| `VITE_TURNSTILE_SITE_KEY` | Variable | The site build (`deploy-site.yml`); public by design |
| `TURNSTILE_SECRET_KEY` | Secret | The Worker's `TURNSTILE_SECRET_KEY` |
| `E2E_ENQUIRY_DRY_RUN_TOKEN` | Secret, dev only | The Worker's `ENQUIRY_DRY_RUN_TOKEN`, and the e2e suite's `X-Enquiry-Dry-Run` header |

`deploy.yml` writes the Worker's secrets to a JSON file in `$RUNNER_TEMP` and deploys with `wrangler deploy --secrets-file`, then deletes the file. It does not use wrangler-action's `secrets:` input. That input runs `wrangler secret bulk` without the step's `-c` and `--env`, so it reads the default `wrangler.toml`. On the first deploy it created a stray Worker named `shopify-automation-worker` holding both secrets, and left the enquiry Worker with none, so every enquiry failed Turnstile with a 403.

## One-time Cloudflare setup

Already done for dev. Production still needs the items marked *(#64)*.

1. **Email Routing on the `notify.` subdomain.** Dashboard → houseofmornii.com → Email → Email Routing → Settings → add the subdomain `notify.houseofmornii.com`, and let Cloudflare add its MX and SPF records there. The root domain's mail (Microsoft 365) is untouched: only `notify.` sends.
2. **Verify each destination address.** Email Routing → Destination addresses → add the address and click the link Cloudflare emails to it. Dev's address is verified. For production, verify `contact@houseofmornii.com` *(#64)*; this needs the contact@ mailbox (or its forward) receiving mail.
3. **Turnstile widgets.** Dev uses the test site key `1x00000000000000000000AA` and test secret `1x0000000000000000000000000000000AA`, which pass any token on any host. For production, create a widget for `houseofmornii.com` (Managed mode). Set its site key as the `production` variable `VITE_TURNSTILE_SITE_KEY`, and its secret as the `production` secret `TURNSTILE_SECRET_KEY`.
4. **KV namespaces.** `wrangler kv namespace create enquiry-rate-dev` (and `-production`), with the ids in `wrangler.enquiry.toml`. Both exist.
5. **CSP.** `public/_headers` allows `https://challenges.cloudflare.com` in `script-src`, `connect-src` and `frame-src` for the widget.

## Testing

| Layer | File | Covers |
|-------|------|--------|
| Unit | `workers/enquiry.test.ts` | Every check and response above, the dry-run rules, the header encoding and injection guards, the message format |
| Unit | `src/components/EnquiryForm.test.tsx` | Validation and focus, the request body, every response, the token reset, the compact widget in a space under 300px, and the redraw when the space crosses 300px |
| e2e, read-only | `e2e/read-only/enquiry-form.spec.ts` | The Product dialog and `/contact#styling` open the form and validate an empty submit. It never sends |
| e2e, dev-only | `e2e/dev-only/enquiry.spec.ts` | A product enquiry and a styling enquiry go through every check on the dev Worker in dry run, and the form shows the success message |
| Launch checks | `e2e/read-only/launch-checks.spec.ts` | "Contact with the styling form open" has no sideways scroll, meets the 44px targets and passes axe |

**Dry run.** The dev-only spec adds `X-Enquiry-Dry-Run: <token>` to the `/api/enquiry` request only (a Playwright route, not `setExtraHTTPHeaders`, which would send it to every host). The route fetches the Worker's answer itself with `route.fetch()` and records its status and body; reading the body of a request passed on with `route.continue()` hung in CI. The Worker runs every check except the rate limit, which a dry run skips because CI retries from one runner IP. It then answers `{ok:true,dryRun:true}` without sending. On production the token is unset, so the header does nothing.

**Delivery is checked by hand.** No automated test sends a real email. After changing the Worker, its mail binding or Email Routing, send one real enquiry on dev from the form, or with curl (the dev Turnstile secret accepts any token):

```bash
curl -s https://dev.houseofmornii.com/api/enquiry \
  -H 'Origin: https://dev.houseofmornii.com' -H 'Content-Type: application/json' \
  -d '{"kind":"styling","name":"Delivery check","email":"you@example.com","message":"Checking that enquiries arrive.","turnstileToken":"test"}'
```

Expect `{"ok":true}`, then an email in the dev inbox from `enquiries@notify.houseofmornii.com`, with Reply-To set to the sender. In production, the launch-day check is one enquiry from the real form; a curl cannot pass the real widget.

**The CI wait.** The Workers (`deploy.yml`) and the site (`deploy-site.yml`) deploy in parallel. Before the suite runs on dev, *Wait for the enquiry Worker* polls `GET /api/enquiry` for its 405, for up to 5 minutes, with no query string (see Troubleshooting).

## Troubleshooting

Watch the outcome lines live with `npx wrangler tail -c wrangler.enquiry.toml --env dev`.

| Symptom | Likely cause |
|---------|--------------|
| 403 on every enquiry, outcome `turnstile_failed` | The Worker lacks `TURNSTILE_SECRET_KEY`, or the secret and the site key belong to different widgets. Check with `npx wrangler secret list -c wrangler.enquiry.toml --env dev` |
| 403, outcome `bad_origin` | The request did not come from `APP_ORIGIN`, for example a preview host or a curl without `Origin` |
| 502, outcome `send_failed` | The destination is not verified in Email Routing, or Email Routing is off for `notify.`. The Worker logs the binding's error message |
| No form on the page | The site was built without `VITE_TURNSTILE_SITE_KEY` |
| Sideways scroll on a phone | The 300px normal widget in a space narrower than 300px. The form picks the size from its container's width and redraws the widget when that width crosses 300px (a ResizeObserver) |
| 404 from `/api/enquiry` | The route is missing, or the request hit the static site (the Worker is not deployed) |
| `GET /api/enquiry?x` answers 200, `POST /api/enquiry?x` 405 | The Worker route matches the exact path only: with a query string the request reaches the static site. The form never adds one |
