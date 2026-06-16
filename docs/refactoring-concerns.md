# MVP Refactoring: Analysis of Potential Concerns

This document outlines the identified concerns categorized into Functional, Technical, Operational, and Security domains, discovered during the architectural review of the Shopify Storefront integration.

## 1. Functional Concerns

- **Silent Demo Fallback**: The application currently falls back to demo mode if Shopify credentials are missing. This can lead to a production site that appears visually healthy but has a non-functional checkout process (using `#` as a placeholder), misleading stakeholders and customers.
- **Unverified Buyer Journey**: Current testing and development heavily rely on demo fixtures. Consequently, the actual end-to-end path—from product discovery through the Shopify-hosted checkout—remains unverified in a live environment.
- **Degraded Error UX**: API failures (e.g., 5xx errors or GraphQL errors) are often collapsed into "not found" or empty states. This prevents users from understanding that a service disruption is occurring and instead suggests that products are simply unavailable.

## 2. Technical Concerns

- **Auth Mode Mismatch**: There is a discrepancy between the requested GraphQL fields (e.g., `tags`) and the supported authentication modes (tokenless vs. token-based). This mismatch can cause runtime failures when the app attempts to fetch token-gated data in a tokenless configuration.
- **Error Handling Inconsistency**: While a typed `StorefrontError` class exists, its implementation across hooks and components is inconsistent, leading to varied and unpredictable error presentation across different pages.
- **Test Coverage Gap**: The existing test suite primarily exercises demo mode behavior. This leaves the actual Shopify integration logic, error-mapping paths, and live-mode contract enforcement under-tested.

## 3. Operational Concerns

- **Misconfiguration Risk**: A deployment without proper credentials might appear healthy but will be commercially non-functional (a "silent failure"), creating significant risk for the business during the transition to production.
- **Incident Diagnosis Difficulty**: The lack of distinct error states (e.g., distinguishing between a 404 and an upstream API outage) makes it difficult for operations teams to diagnose and respond to production issues effectively.
- **Deployment Complexity**: The refactoring requires precise alignment of Shopify scopes, environment variables, and Cloudflare configurations to ensure a seamless transition from the prototype to a live storefront.

## 4. Security Concerns

- **Token-Gated Data Exposure**: There is a risk of attempting to access token-gated fields in a tokenless configuration, which could lead to broken queries or unexpected behavior if not properly gated.
- **Production Guardrail Enforcement**: It is critical to ensure that the application "fails closed" and refuses to mount in production if the Storefront API is not correctly configured, preventing the accidental serving of a broken storefront.
- **Security Header Management**: The refactoring process must ensure that the implementation of critical security headers (e.g., CSP, HSTS) is maintained and correctly configured within the Cloudflare/Pages environment.
