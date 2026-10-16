# Security Policy

## Supported Versions

House of Mornii Shop is deployed continuously from the `main` branch. Only the
latest deployed production build is supported with security fixes; there are
no maintained legacy versions.

| Branch/Deployment | Supported          |
| ------------------ | ------------------- |
| `main` (production) | :white_check_mark: |
| Feature branches / PRs | :x:              |

## Reporting a Vulnerability

If you discover a security vulnerability in this project (e.g. XSS, CSRF,
credential exposure, dependency vulnerabilities, or misconfigured
infrastructure), please report it privately rather than opening a public
GitHub issue.

**Contact:** security@houseofmornii.com

Please include:

- A description of the vulnerability and its potential impact
- Steps to reproduce (proof-of-concept code or requests, if available)
- The affected URL, file, or component
- Your suggested remediation, if you have one

## Response Expectations

- **Acknowledgement:** within 2 business days of your report
- **Initial assessment:** within 5 business days, including severity and
  expected remediation timeline
- **Resolution:** critical/high severity issues are prioritized for a fix or
  mitigation within 14 days; lower severity issues are addressed in the
  normal development cycle

We ask that you give us a reasonable amount of time to investigate and
remediate an issue before any public disclosure. We do not currently operate
a paid bug bounty program, but we will credit reporters (with permission) in
release notes where appropriate.

## Scope

This policy covers the House of Mornii Shop web application source code,
build/deployment pipeline (Cloudflare Pages, GitHub Actions), and the
Cloudflare Worker used as a Shopify Storefront API proxy. It does not cover
third-party services (Shopify, Cloudflare) themselves — please report issues
with those platforms directly to their respective security teams.
