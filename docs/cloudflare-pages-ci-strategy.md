# Research: Cloudflare Pages CI/CD Pipeline Strategy

**Ticket:** #20 — Research: Cloudflare Pages CI/CD pipeline strategy and preview URL approach  
**Status:** Complete — findings below formed the basis for ticket #21 (implementation).

---

## Deployment Platform Decision

**Chosen: Cloudflare Pages**

Rationale:
- Free tier covers House of Mornii's expected traffic (100,000 requests/day, unlimited bandwidth)
- Automatic HTTPS/TLS on both production and preview branches
- Built-in image CDN and edge caching for static assets (Vite-hashed filenames → 1-year immutable cache)
- Native preview URL per pull request — no extra configuration needed
- Zero-config SPA routing: `_redirects` file already present (`/* /index.html 200`)
- Cloudflare Workers integration available if serverside logic is ever needed (newsletter webhook, etc.)
- `wrangler-action` GitHub Actions integration is stable and maintained by Cloudflare

Alternative evaluated: **Vercel** — comparable feature set but lower free bandwidth cap. Cloudflare Pages has no bandwidth limit.

---

## CI/CD Architecture

```
GitHub push/PR  →  GitHub Actions deploy.yml  →  Cloudflare Pages
                        │
                        ├── npm ci
                        ├── vitest run (unit tests must pass)
                        ├── vite build (with env secrets injected)
                        └── wrangler pages deploy dist
```

### Per-commit deployments

Every push to `main` deploys to production (`https://houseofmornii.com`).

### Preview deployments

Every pull request automatically gets a preview URL from Cloudflare Pages:
```
https://<branch-hash>.house-of-mornii.pages.dev
```

Preview environments use **separate secrets** so production credentials are never used on PRs. Set both `DEV_VITE_SHOPIFY_*` and `VITE_SHOPIFY_*` as GitHub secrets — the workflow uses the latter for all builds, so branch builds must target a dev store via the same secret names. Use a separate Cloudflare Pages project environment if you need separate store credentials per environment.

---

## Required GitHub Secrets

| Secret | Description | Scope |
|--------|-------------|-------|
| `VITE_SHOPIFY_STORE_DOMAIN` | Shopify storefront domain | Build |
| `VITE_SHOPIFY_STOREFRONT_TOKEN` | Public Storefront API token | Build |
| `VITE_GA4_MEASUREMENT_ID` | GA4 measurement ID | Build |
| `VITE_META_PIXEL_ID` | Meta Pixel ID | Build (optional) |
| `CLOUDFLARE_API_TOKEN` | API token with Cloudflare Pages edit permission | Deploy |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID | Deploy |

---

## Cloudflare Pages Project Setup (Manual Steps)

1. In Cloudflare dashboard: **Workers & Pages → Create application → Pages → Connect to Git**
2. Select the GitHub repository
3. Framework preset: **None** (Vite output is already in `dist/`)
4. Build command: *(leave empty — build is done in GitHub Actions, not Cloudflare Pages CI)*
5. Output directory: `dist`
6. Add environment variables for production in **Settings → Environment variables**
7. Get the API token: **Profile → API Tokens → Create Token → Edit Cloudflare Pages**

---

## Branch Protection Recommendation

Require the `build-and-deploy` job to pass before merging PRs. This gates on:
- All 75+ unit tests passing
- TypeScript + Vite build succeeding

Enable in GitHub: **Settings → Branches → Add rule → Require status checks → `build-and-deploy`**

---

## Future: Staging Environment

When a dedicated dev store is provisioned, add a `staging` branch build that:
- Uses `DEV_VITE_SHOPIFY_STORE_DOMAIN` and `DEV_VITE_SHOPIFY_STOREFRONT_TOKEN` secrets
- Deploys to `staging.houseofmornii.com` (custom alias via Cloudflare Pages settings)
- Runs E2E tests automatically against the staging deployment before merging to `main`

---

## Implementation Status

- `.github/workflows/deploy.yml` — created and deployed (ticket #21 ✅)
- `.github/workflows/e2e.yml` — created, runs nightly against production (ticket #44 ✅)
- `public/_headers` — security headers configured ✅
- `public/_redirects` — SPA routing rule configured ✅
