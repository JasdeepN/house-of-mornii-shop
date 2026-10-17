# 16 - End-to-End Tests

The Playwright suite drives a deployed build in a real browser. It exists because unit tests mock the Cart and so missed bugs such as #42 (Add to bag stuck on "Adding…"). Decisions are in issue #43; the build is #44.

## Two tiers

Each tier runs at two widths: desktop (1440px) and phone (390px). The four Playwright projects are `read-only-desktop`, `read-only-phone`, `dev-only-desktop` and `dev-only-phone` (`playwright.config.ts`). Workers is 1, because every spec shares one dev store and one Customer.

### `e2e/read-only` (safe anywhere)

Puts things in a Bag at most; never places an Order or signs in.

| Spec | Journeys |
|------|----------|
| `shop-filters.spec.ts` | Choosing a Type writes `?type=`; Hide sold out writes `available=1`; Sort writes `sort=price-asc` and Recommended removes it; Back restores the filters in the address and on screen |
| `product-page.spec.ts` | The two-Variant test Product defaults to Gold at $20.00 and shows Silver as unavailable; Add to bag works, and works again (#42). Dev only (skipped elsewhere) |
| `quick-add.spec.ts` | One Variant: + opens the Bag. Several Variants: + opens "Choose an option", and choosing fills the Bag. A sold-out Product's + is disabled |
| `bag.spec.ts` | Flyout: + raises the quantity, − lowers it, remove empties the Bag. Bag page: lists both Products, subtotal equals their sum; an empty Bag says so. Proceed to Checkout links to the checkout domain and is never followed |
| `security-headers.spec.ts` | HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, long cache on static assets |
| `env-guard.spec.ts` | The dev guard accepts only the exact dev origin and rejects production and look-alikes |

### `e2e/dev-only` (real Orders and sign-in)

`requireDevTarget()` in `e2e/support/env.ts` throws unless the target origin is exactly `https://dev.houseofmornii.com`. Both specs call it in `beforeAll`, and the Admin client calls it too.

| Spec | Journeys |
|------|----------|
| `sign-in.spec.ts` | Signed out: Sign in with the test Customer's email reaches Shopify's hosted sign-in page and stops (never submitted). Signed in with the saved session: `/account` greets the Customer, the header menu shows Orders and Sign out, and Account details show the email. The phone sign-in is marked `fixme` (the phone header has no Sign in control, #47) |
| `checkout.spec.ts` | The signed-in Customer passes the store password, adds "Test – One Variant", checks the Proceed to Checkout link gains `sso=silent`, pays with Shopify's Bogus Gateway, then the Order is verified in Admin (one line, title, quantity, price, Customer email) and on `/account/orders`. The Order is cancelled and archived in a `finally` |

## Run it locally

One-time: `npm ci` and `npx playwright install chromium`. There is no `webServer`: the suite tests a deployed build (default `https://dev.houseofmornii.com`) or a `vite preview` you start yourself, with `E2E_BASE_URL` pointing at it.

Secrets come from the git-ignored `.env.e2e.local` (`KEY=value` lines; real environment variables win). `e2e/support/load-env.ts` also reads `.env.development.local`, which supplies `VITE_SHOPIFY_STORE_DOMAIN` and `VITE_SHOPIFY_STOREFRONT_TOKEN` (the Storefront token the setup uses to confirm the test Products are visible).

| Variable | Used for |
|----------|----------|
| `E2E_BASE_URL` | Target site. Defaults to `https://dev.houseofmornii.com` |
| `E2E_SHOPIFY_STORE_DOMAIN` | The dev store's `*.myshopify.com` domain, for the Admin API |
| `E2E_STORE_PASSWORD` | The dev store's password page |
| `E2E_SHOPIFY_CLIENT_ID`, `E2E_SHOPIFY_CLIENT_SECRET` | The "dev-store" app's client credentials |
| `E2E_CUSTOMER_SESSION` | The saved `hom_customer_session` cookie of the test Customer |

| Command | Does |
|---------|------|
| `npm run test:e2e` | Both tiers, against dev |
| `npm run test:e2e:read-only` | Read-only tier only (both widths) |
| `npm run test:e2e:ui` | Playwright's interactive UI |
| `npm run test:e2e:report` | Opens the HTML report |
| `npm run e2e:session` | Refreshes the saved Customer session |
| `npx playwright test e2e/read-only/bag.spec.ts` | One spec file |

## Run it in CI

**After every `dev` deploy.** `.github/workflows/deploy-site.yml`, on branch `dev` only, after the Cloudflare deploy:

1. *Wait for dev.houseofmornii.com to serve this build*: polls (up to 4 minutes) until the live `index.html` references the new entry script.
2. *Install Playwright Chromium*.
3. *Run end-to-end tests*: `npm run test:e2e` with `CI=true` and `E2E_BASE_URL=https://dev.houseofmornii.com`. CI retries a failed test once.
4. *Upload Playwright report* and *Upload test results* (traces and screenshots kept on failure), as the artifacts `playwright-report-<run id>` and `playwright-results-<run id>`, kept 14 days, uploaded even when tests fail.

Secrets on the GitHub environment `dev`: `E2E_STORE_PASSWORD`, `E2E_CUSTOMER_SESSION`, `E2E_SHOPIFY_CLIENT_ID`, `E2E_SHOPIFY_CLIENT_SECRET`. The store domain comes from `VITE_SHOPIFY_STORE_DOMAIN` (also on `dev`) and is passed as `E2E_SHOPIFY_STORE_DOMAIN`.

**By hand.** `.github/workflows/e2e.yml` (`workflow_dispatch`, environment `dev`) has two inputs:

- `base_url`: default `https://dev.houseofmornii.com`.
- `tier`: `read-only` (default) or `all`. `all` runs `npm run test:e2e`, and the first step fails the run unless `base_url` is the dev origin.

It uploads the same two artifacts.

## Test data

- **Products.** Global setup (`e2e/support/global-setup.ts`, dev target only) calls `ensureTestProducts()`. It is idempotent: it creates or updates two Products tagged `hom-e2e` (handles `hom-e2e-one-variant`, `hom-e2e-two-variants`), publishes them to every sales channel, and waits until the Storefront API shows them. "Test – One Variant" costs $10.00 with untracked stock. "Test – Two Variants" has Gold at $20.00 (untracked) and Silver at $25.00 (tracked, quantity 0, so sold out). They stay on dev as ordinary content, in no Collection.
- **Admin access.** `e2e/support/admin.ts` asks for a 24-hour token with the client credentials grant from the "dev-store" app's `E2E_SHOPIFY_CLIENT_ID` and `E2E_SHOPIFY_CLIENT_SECRET`, and caches it.
- **Orders.** After checkout, the Order is verified, then tagged `hom-e2e`, cancelled (no refund, no Customer notice) and archived (`cancelAndArchiveOrder`). If the page never named the Order, a fallback finds open Orders for the test email created since the run began.
- **Customer.** `jasdeepn4+hom-e2e@gmail.com`. The suite adds the saved `hom_customer_session` cookie; it renews with use.

## Refresh the saved session

The session lapses about 30 days after it was last renewed. The customer-session Worker renews it, for another 30 days, whenever it refreshes the Customer's token, which regular runs trigger. Symptoms: dev-only specs fail on the account pages, or throw "`E2E_CUSTOMER_SESSION` is empty".

```bash
npm run e2e:session -- --github
```

The tool opens the sign-in flow for the test Customer, then asks for the 6-digit code that Shopify emails to that inbox. Type it within 10 minutes: that is the customer-session Worker's sign-in window. It then checks that dev reports a session, writes `E2E_CUSTOMER_SESSION` to `.env.e2e.local`, and with `--github` also stores it as the secret on the `dev` environment (needs `gh` signed in). Without `--github` it only updates the local file.

## Known behaviours and why

- **Store password page.** dev-hom is a Partner development store, so checkout first shows a password page. `unlockCheckout` passes it once per browser context, up front; otherwise Shopify holds the first checkout request for 25 to 80 seconds.
- **Card fields need typing.** Shopify validates keystrokes in its card iframes, so `fill()` shows text but stays "empty". The helpers use `pressSequentially`.
- **Thank-you page.** It shows "Processing…" first, so `readConfirmation` polls (up to 4 minutes). On phones it shows only the confirmation number, not the Order name, so the test finds the Order by `confirmation_number`.
- **Admin search lags a new Order** by a minute or so, so the lookups retry.
- **`sso=silent` appears late.** The page learns about the Customer session a moment after load, so the test waits for the checkout link to gain `sso=silent`.
- **Bot check.** Shopify's silent sign-in runs through shopify.com, whose Cloudflare bot check stops browsers on data-centre IPs. The test asserts the link, removes `sso`, and checks out entering the Customer's email; Shopify files the Order under that Customer.
- **United States only.** The dev store ships only to the United States, so the test uses a New York address. (The code tries Canada first when the country list offers it, then falls back to New York.)
- **Slow.** Checkout takes about 3 minutes locally (form about 45 s, Payment about 2 minutes more), so its timeout is 8 minutes.

## Production

Never Orders or sign-in: the dev-only tier refuses any target but dev, in code and in `e2e.yml`. From v1.0 the read-only tier runs after production deploys, and a red dev run blocks production (#46). On a non-dev target the read-only specs that need test Products find suitable ones by trying quick add on the Shop page (`pickProducts` in `e2e/support/pick.ts`), which only fills a throwaway Bag.

## Adding a journey

- Wait on elements, never `networkidle`.
- Shopper-facing text says Bag; code and test names may say Cart.
- A dev-only journey calls `requireDevTarget()` and always cleans up its Orders.
- Put shared steps in `e2e/support/`.
