# Deployment Environments Setup Guide

**Status:** Requires manual Cloudflare Pages and GitHub Actions configuration  
**Last updated:** 2025-01-XX

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions                            │
│                                                              │
│  push to test branch ──→ deploy-dev (house-of-mornii-dev)   │
│  workflow_dispatch(dev) ──→ deploy-dev                      │
│  workflow_dispatch(prod) ──→ deploy-prod (house-of-mornii)  │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
    Cloudflare Pages dev      Cloudflare Pages prod
    Project: house-of-mornii-   Project: house-of-mornii
    dev                        │
          │                     │
    Preview URL:              https://houseofmornii.com
    https://<hash>.pages.dev  (production)
    + custom domain:
      https://dev.houseofmornii.com
```

### Key Design Decisions

1. **Separate Cloudflare Pages projects** — `house-of-mornii-dev` and `house-of-mornii` are independent deployments with separate secrets, branches, and URLs.
2. **Shared build artifact** — The `build` job runs once (tests + build), then uploads `dist/` as an artifact. Both deploy jobs download the same artifact, ensuring dev and prod use identical code.
3. **No production auto-deploy from push** — Production deploys only via manual `workflow_dispatch` with `environment: prod`. This prevents accidental releases.
4. **Test branch → dev auto-deploy** — Pushing to `test` branch automatically deploys to the dev project, enabling continuous integration testing.

---

## Step 1: Create Cloudflare Pages Projects

### Dev Project (house-of-mornii-dev)

1. Go to **Cloudflare Dashboard → Workers & Pages → Create application → Pages → Connect to Git**
2. Select your GitHub repository
3. **Project name:** `house-of-mornii-dev`
4. **Branch:** `test` (or leave blank for manual-only deploys via wrangler)
5. **Framework preset:** None
6. **Build command:** *(leave empty — build runs in GitHub Actions)*
7. **Build output directory:** `dist`
8. **Environment variables:** Set dev-specific values:
   ```
   VITE_SHOPIFY_STORE_DOMAIN=your-dev-store.myshopify.com
   VITE_SHOPIFY_STOREFRONT_TOKEN=dev-storefront-token
   VITE_SITE_NAME=House of Mornii (Dev)
   VITE_SITE_URL=https://dev.houseofmornii.com
   ```
9. **Custom domain:** Add `dev.houseofmornii.com` as a custom domain (Settings → Custom Domains → Create)

### Prod Project (house-of-mornii)

1. Same flow, but:
2. **Project name:** `house-of-mornii`
3. **Branch:** `main`
4. **Environment variables:** Set production values:
   ```
   VITE_SHOPIFY_STORE_DOMAIN=your-prod-store.myshopify.com
   VITE_SHOPIFY_STOREFRONT_TOKEN=prod-storefront-token
   VITE_SITE_NAME=House of Mornii
   VITE_SITE_URL=https://houseofmornii.com
   ```
5. **Custom domain:** `houseofmornii.com` should already be configured

---

## Step 2: Configure GitHub Actions Secrets and Variables

### Required Secrets (Settings → Secrets and variables → Actions → Secrets)

| Secret | Dev Scope | Prod Scope | Description |
|--------|-----------|------------|-------------|
| `CLOUDFLARE_API_TOKEN` | ✅ | ✅ | API token with Pages edit permission |
| `CLOUDFLARE_ACCOUNT_ID` | ✅ | ✅ | Your Cloudflare account ID |
| `VITE_SHOPIFY_STORE_DOMAIN` | ✅ | ✅ | Shopify storefront domain |
| `VITE_SHOPIFY_STOREFRONT_TOKEN` | ✅ | ✅ | Storefront API public token |
| `VITE_SHOPIFY_ADMIN_ACCESS_TOKEN` | ⬜ | ✅ | Admin API token (prod only) |
| `VITE_GA4_MEASUREMENT_ID` | ⬜ | ✅ | Google Analytics ID (prod only) |
| `VITE_META_PIXEL_ID` | ⬜ | ✅ | Meta Pixel ID (prod only) |

### Required Variables (Settings → Secrets and variables → Actions → Variables)

| Variable | Dev Scope | Prod Scope | Default Value |
|----------|-----------|------------|---------------|
| `VITE_SITE_NAME` | ✅ | ✅ | `House of Mornii` |
| `VITE_SITE_TITLE` | ✅ | ✅ | `House of Mornii - Regal Costume Jewelry` |
| `VITE_SITE_DESCRIPTION` | ✅ | ✅ | SEO description |
| `VITE_SITE_URL` | ✅ | ✅ | `https://dev.houseofmornii.com` (dev), `https://houseofmornii.com` (prod) |
| `VITE_CONTACT_EMAIL` | ⬜ | ✅ | Contact email |
| `VITE_NEWSLETTER_ENDPOINT` | ⬜ | ✅ | Newsletter API endpoint |

### Setting Environment-Scoped Secrets in GitHub Actions

GitHub Actions supports environment-scoped secrets. Create two environments:

1. **Go to:** Settings → Environments → New Environment
2. **Environment name:** `dev`
   - Add required secrets/variables scoped to this environment
3. **Environment name:** `production`
   - Add production-specific secrets/variables

---

## Step 3: Configure GitHub Actions Environment Protection Rules

### For `production` environment:

1. Go to Settings → Environments → `production`
2. Enable **"Required reviewers"** — add 1-2 people who approve prod deployments
3. Set **"Deployment branches"** to `main` only
4. (Optional) Enable **"Wait timer"** for additional safety

---

## Step 4: Verify Workflow Triggers

### Manual deployment via GitHub UI

1. Go to **Actions → Deploy to Cloudflare Pages**
2. Click **"Run workflow"**
3. Select branch (usually `main`)
4. Choose environment: `dev` or `prod`
5. Click **"Run workflow"**

### Auto-deploy to dev

Push to `test` branch triggers dev deployment automatically:
```bash
git checkout test
# make changes
git push origin test
```

### Production deploys are manual-only

The workflow has no `push: branches: [main]` trigger for prod — this is intentional. Production requires explicit approval via the GitHub Actions UI.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Deploy fails with "project not found" | Ensure Cloudflare Pages projects are created with exact names `house-of-mornii-dev` and `house-of-mornii` |
| Build fails with demo mode error | Set `VITE_SHOPIFY_STORE_DOMAIN` and `VITE_SHOPIFY_STOREFRONT_TOKEN` secrets |
| Custom domain not resolving | Verify DNS records in Cloudflare dashboard; CNAME for `dev.houseofmornii.com` → `<project>.pages.dev` |
| Prod deploy triggers accidentally | Check workflow file — there should be no `push: branches: [main]` trigger for prod job |
| Secrets not available in job | Ensure secrets are scoped to the correct environment (dev/production) in GitHub Actions settings |

---

## Rollback Instructions

### Cloudflare Pages rollback

1. Go to **Cloudflare Dashboard → Workers & Pages → Your Project → Deployments**
2. Find the previous working deployment
3. Click **"Rollback to this deployment"**

### GitHub Actions rollback

```bash
# Find previous commit
git log --oneline -10

# Revert and push
git revert <commit-hash>
git push origin main
```

---

## Post-Deployment Verification Checklist

After each deployment:

- [ ] Visit dev URL (https://dev.houseofmornii.com) — verify page loads, no console errors
- [ ] Test Shopify product data displays correctly
- [ ] Verify cart functionality works
- [ ] Check analytics are firing (prod only)
- [ ] Run E2E tests if available
- [ ] Update deployment status in GitHub Actions
