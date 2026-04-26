# Research: Production Domain DNS, SSL, and Cloudflare CDN Configuration

**Ticket:** #27 — Research: Production domain DNS, SSL, and Cloudflare CDN configuration for houseofmornii.com

---

## Architecture Overview

```
Cloudflare Registrar
  └── Cloudflare DNS
    └── DNS A/CNAME → Cloudflare Pages
      └── house-of-mornii.pages.dev (origin)
```

The domain is owned by the business and registered through Cloudflare. Cloudflare acts as registrar, DNS provider, CDN/proxy, and TLS manager. This gives:
- Automatic TLS certificate via Cloudflare Universal SSL (no manual cert management)
- Global CDN edge caching for static assets
- DDoS protection at the network layer
- Analytics and performance metrics in Cloudflare dashboard

---

## Step 1: Confirm Domain in Cloudflare

1. Log in to Cloudflare Dashboard
2. Confirm `houseofmornii.com` appears under registered domains / websites
3. Confirm DNS is managed in the same Cloudflare account that owns the domain
4. Confirm the active Cloudflare Pages project is `house-of-mornii`

---

## Step 2: Confirm Cloudflare DNS Authority

Because the registrar is Cloudflare, there is no external registrar nameserver handoff to perform.

1. Cloudflare Dashboard → **Websites → houseofmornii.com → DNS**
2. Confirm DNS records are editable in Cloudflare
3. Confirm no legacy A/CNAME records conflict with the Cloudflare Pages records
4. If any old records exist for `@` or `www`, document them before replacing

---

## Step 3: Connect Custom Domain to Cloudflare Pages

1. Cloudflare Dashboard → **Workers & Pages → house-of-mornii → Custom domains**
2. Click **Set up a custom domain**
3. Enter `houseofmornii.com` → Cloudflare automatically adds a `CNAME` record pointing to `house-of-mornii.pages.dev`
4. Repeat for `www.houseofmornii.com` → this creates a second CNAME

---

## Step 4: SSL/TLS Configuration

Cloudflare handles TLS automatically:

1. **Cloudflare Dashboard → SSL/TLS → Overview**
2. Set encryption mode to **Full (strict)** (pages.dev origin already has valid TLS)
3. Under **Edge Certificates → Always Use HTTPS** → toggle ON
4. Under **Edge Certificates → Minimum TLS Version** → set to **TLS 1.2** (or 1.3 for stricter)
5. Under **Edge Certificates → Automatic HTTPS Rewrites** → toggle ON

Cloudflare Universal SSL is free and covers `houseofmornii.com` and `*.houseofmornii.com`.

---

## Step 5: www → Apex Redirect (or Apex → www)

**Recommended: apex is canonical, www redirects to it** (consistent with current meta tags using `houseofmornii.com`).

In Cloudflare Dashboard → **Rules → Redirect Rules → Create rule**:
- Rule name: `www to apex redirect`
- Field: `Hostname equals www.houseofmornii.com`
- Action: `Dynamic redirect → https://houseofmornii.com/${uri.path} → 301`

Or use a **Page Rule** (legacy):
- URL: `www.houseofmornii.com/*`
- Setting: **Forwarding URL → 301** → `https://houseofmornii.com/$1`

---

## Step 6: CDN Caching Configuration

Cloudflare automatically caches static assets for Vite-built sites (hashed filenames = immutable).

Verify in **Caching → Configuration**:

| Setting | Recommended Value |
|---------|-------------------|
| **Caching Level** | Standard |
| **Browser Cache TTL** | Respect Existing Headers (Vite sets `Cache-Control: max-age=31536000`) |
| **Always Online** | On |
| **Development Mode** | OFF (only enable temporarily when actively deploying) |

The `public/_headers` file already sets proper security headers and cache headers:

```
/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

## Step 7: Performance Optimizations (Optional)

Enable in **Speed → Optimization**:

| Feature | Recommended |
|---------|-------------|
| **Auto Minify JS/CSS/HTML** | Off (Vite already minifies; Cloudflare minification can conflict) |
| **Brotli Compression** | On |
| **HTTP/2** | On (default) |
| **HTTP/3 (QUIC)** | On (if available on plan) |
| **Early Hints** | On |
| **Rocket Loader** | Off (can break React hydration) |

---

## Step 8: Security (WAF and Bot Management)

Cloudflare Free plan includes:

- **DDoS protection**: Always on
- **Bot Fight Mode**: Enable in Security → Bots
- **Security Level**: Medium (default) — set to High if experiencing abuse on `/api/*` routes

The app has no server-side endpoints (pure SPA), so WAF rules are primarily for protecting the Shopify checkout redirect and any future edge functions.

---

## DNS Records Summary

After setup, Cloudflare DNS should have these records:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | `houseofmornii.com` | `house-of-mornii.pages.dev` | Proxied (orange cloud) |
| CNAME | `www` | `house-of-mornii.pages.dev` | Proxied (orange cloud) |

> If the registrar requires an A record instead of CNAME at the apex, use Cloudflare's **CNAME flattening** (automatic — Cloudflare resolves the CNAME to an A record at the DNS edge).

---

## Verification Checklist

After completing all steps:

- [ ] `https://houseofmornii.com` loads the site over HTTPS
- [ ] `https://www.houseofmornii.com` redirects to `https://houseofmornii.com`
- [ ] `http://houseofmornii.com` redirects to `https://houseofmornii.com`
- [ ] Browser shows padlock — valid SSL cert issued by Cloudflare
- [ ] `curl -I https://houseofmornii.com` shows `cf-ray:` header (confirming Cloudflare proxy is active)
- [ ] Cloudflare Analytics shows traffic on the domain

---

## Estimated Time to Complete

- Confirming Cloudflare domain and DNS access: 10 min
- Adding Cloudflare Pages custom domains: 10-15 min
- DNS propagation: usually minutes when managed inside Cloudflare
- SSL provisioning: automatic (minutes after nameserver activation)
- Performance and security config: 30 min

---

*Implementation: see ticket #28 — Implement: Custom domain setup, SSL provisioning, and production Cloudflare configuration*
