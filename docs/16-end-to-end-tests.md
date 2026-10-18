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
| `launch-checks.spec.ts` | Launch checks from #51/#52; see [Launch checks](#launch-checks) |
| `env-guard.spec.ts` | The dev guard accepts only the exact dev origin and rejects production and look-alikes |
| `enquiry-form.spec.ts` | Product page: "Ask about this piece" opens the form, and an empty submit shows the field errors. Contact: `/contact#styling` opens the styling form, and "Book your appointment" reveals it. Never sends ([17 - Enquiries](./17-enquiries.md)) |

### `e2e/dev-only` (real Orders and sign-in)

`requireDevTarget()` in `e2e/support/env.ts` throws unless the target origin is exactly `https://dev.houseofmornii.com`. Every spec calls it in `beforeAll`, and the Admin client calls it too.

| Spec | Journeys |
|------|----------|
| `sign-in.spec.ts` | Signed out: Sign in with the test Customer's email reaches Shopify's hosted sign-in page and stops (never submitted). Signed in with the saved session: `/account` greets the Customer, the header menu shows Orders and Sign out, and Account details show the email. The phone header has Sign in (#47), so the journey runs at both widths |
| `checkout.spec.ts` | The signed-in Customer passes the store password, adds "Test – One Variant", checks the Proceed to Checkout link gains `sso=silent`, pays with Shopify's Bogus Gateway, then the Order is verified in Admin (one line, title, quantity, price, Customer email) and on `/account/orders`. The Order is cancelled and archived in a `finally` |
| `enquiry.spec.ts` | A product enquiry on the two-Variant test Product and a styling enquiry from `/contact#styling` pass every Worker check in dry run (`X-Enquiry-Dry-Run`, added to `/api/enquiry` only), and the form shows its success message. Nothing is emailed |

## Launch checks

`e2e/read-only/launch-checks.spec.ts` (helpers in `e2e/support/launch-checks.ts`) turns a regression of the v1.0 launch rules into a red deploy. It reads the live site and changes nothing; the Bag tests add a Product to a throwaway Bag. It resolves the pages once from the live site: Home, Shop, Collections, the first Collection, a Product (the two-Variant test Product on dev, a real one elsewhere), the Bag page (`/cart`), About, Contact, Contact with the styling form open (`/contact#styling`), Account, the Refund policy and a 404.

| Check | Measures | Widths and project |
|-------|----------|--------------------|
| No sideways scroll | `scrollWidth` of the document is no wider than `clientWidth`. Runs on every page above plus a real Product with a long description | 320, 375, 390, 768, 1024 and 1440px; it resizes the viewport itself, so it runs once, in `read-only-desktop` |
| Touch targets | Every visible link, button, input, select, textarea and `[role=button]`/`[role=link]` is at least 44x44px. Also the open Bag flyout and the phone menu sheet | 390px, `read-only-phone` |
| Accessibility | axe-core finds no `serious` or `critical` violation on every page, and with the Bag flyout open | Both projects |
| Keyboard focus | Tab from the page top to Add to bag: every stop has an outline of 2px or more, or a box-shadow ring, at 3:1 or better against its background. Then the Bag dialog opens with focus on the dialog or its heading, not a quantity button | 1440px, `read-only-desktop` |

**Exemptions** (touch targets only):
- an inline link inside running prose (an `a` in a `p` whose text is longer than the link's);
- hidden elements: `display: none`, `visibility: hidden`, `hidden`, `inert` or `aria-hidden` ancestors, zero-size boxes, and visually-hidden 1px elements;
- a checkbox or radio is measured by its label when it has one.

**Reduced motion.** Every launch check emulates `prefers-reduced-motion: reduce` (`page.emulateMedia`). Fade-ins and route transitions were measured mid-animation (a low-opacity element reads as low contrast, and a page still sliding in has the wrong size). With reduced motion the app skips its animations, so the page is already at rest when measured.

**Reading a failure.** The message names the page and its path, then lists the offenders:
- Sideways scroll: the width where it failed, `scrollWidth` against `clientWidth`, and up to four elements whose right edge passes the viewport (tag, class, edge in px). If none is listed, look for unbroken text, an `overflow: hidden` ancestor, or an element inside a shadow root, such as the Turnstile iframe.
- Touch targets: `<tag> "name" is WxHpx` for each target under 44px. A name of `(no accessible name; class ...)` also means a missing accessible name.
- axe: the rule id, impact, help text and up to five selectors with the reason.
- Focus: the Tab number and the element, then either "no outline of 2px+ and no box-shadow ring" or its contrast against the background.
The HTML report and traces (artifacts `playwright-report-<run id>` and `playwright-results-<run id>`) hold screenshots.

**Run it against a local preview build.** Build into a scratch directory with the development env (it supplies the Storefront credentials), serve it, and point the suite at it:

```bash
npx vite build --mode development --outDir <scratch-dir>
npx vite preview --outDir <scratch-dir> --port 4173
# in a second shell
E2E_BASE_URL=http://localhost:4173 npx playwright test e2e/read-only/launch-checks.spec.ts
```

Add `--project read-only-phone` or `--project read-only-desktop` to run one project. The target is not the dev origin, so global setup skips the test Products and the checks pick real ones.

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
| `E2E_ENQUIRY_DRY_RUN_TOKEN` | The dev enquiry Worker's dry-run token, sent as `X-Enquiry-Dry-Run` |

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
3. *Wait for the enquiry Worker*: the Workers deploy in parallel from `deploy.yml`, so this polls `GET /api/enquiry` for the Worker's 405, for up to 5 minutes.
4. *Run end-to-end tests*: `npm run test:e2e` with `CI=true` and `E2E_BASE_URL=https://dev.houseofmornii.com`. CI retries a failed test once.
5. *Upload Playwright report* and *Upload test results* (traces and screenshots kept on failure), as the artifacts `playwright-report-<run id>` and `playwright-results-<run id>`, kept 14 days, uploaded even when tests fail.

Secrets on the GitHub environment `dev`: `E2E_STORE_PASSWORD`, `E2E_CUSTOMER_SESSION`, `E2E_SHOPIFY_CLIENT_ID`, `E2E_SHOPIFY_CLIENT_SECRET`, `E2E_ENQUIRY_DRY_RUN_TOKEN`. The store domain comes from `VITE_SHOPIFY_STORE_DOMAIN` (also on `dev`) and is passed as `E2E_SHOPIFY_STORE_DOMAIN`.

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

Never Orders or sign-in: the dev-only tier refuses any target but dev, in code and in `e2e.yml`, and the production workflow never selects it. On a non-dev target the read-only specs that need test Products find suitable ones by trying quick add on the Shop page (`pickProducts` in `e2e/support/pick.ts`), which only fills a throwaway Bag. Global setup skips `ensureTestProducts()` off dev, so the production run needs no secrets.

### Production gate (#46)

Both production deploys (`deploy-site.yml` and the `deploy-production` job of `deploy.yml`) first run `.github/scripts/require-dev-green.sh`. A successful `deploy-site` run on `dev` means that commit passed the full suite, so the gate passes only when the commit's tree (`git rev-parse HEAD^{tree}`) equals the tree of a `dev` commit whose `Deploy site` run concluded `success` (the latest 30 successful runs are checked). Otherwise it fails with "Production deploys only code whose end-to-end run passed on dev: merge a dev commit with a green Deploy site run."

To promote: wait for the `Deploy site` run on the `dev` head to go green, then fast-forward `main` to that commit, or merge `dev` into `main` with a merge commit that changes nothing (same tree). Any extra change on `main`, or a red or still-running dev run, blocks the deploy.

After the production deploy, `deploy-site.yml` waits for houseofmornii.com to serve the new build, then runs only `npm run test:e2e:read-only` against `https://houseofmornii.com` and uploads the same report artifacts. Dry-run the gate locally with `GATE_REF=<sha> .github/scripts/require-dev-green.sh` (needs `gh`).

## Adding a journey

- Wait on elements, never `networkidle`.
- Shopper-facing text says Bag; code and test names may say Cart.
- A dev-only journey calls `requireDevTarget()` and always cleans up its Orders.
- Put shared steps in `e2e/support/`.
