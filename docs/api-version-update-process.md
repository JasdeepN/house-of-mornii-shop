# Shopify API Version Update Process

## Overview

This document defines the process for updating the Shopify Storefront API version used by the House of Mornii storefront.

**Current API Version**: `2026-01` (configured in [`src/lib/shopify/client.ts`](../src/lib/shopify/client.ts:8))

## Why This Matters

Shopify releases new API versions quarterly (February, May, August, November). Each version:
- Introduces new fields and capabilities
- Deprecates fields from previous versions
- Eventually sunsets old versions (typically 12 months after release)

Using an outdated API version can cause:
- **Build failures** if deprecated fields are still queried
- **Missing functionality** if new features aren't available
- **Service disruptions** if the API version is sunset

## Quarterly Review Schedule

| Quarter | Review Window | Target Update |
|---------|--------------|---------------|
| Q1 (Jan-Mar) | February | May release |
| Q2 (Apr-Jun) | May | August release |
| Q3 (Jul-Sep) | August | November release |
| Q4 (Oct-Dec) | November | February next year |

## Update Procedure

### Step 1: Check Shopify Release Notes

1. Visit [Shopify API Release Notes](https://shopify.dev/docs/api/release-notes)
2. Review changes for the upcoming API version
3. Identify deprecated fields that our queries use
4. Note any new fields worth adopting

### Step 2: Update API Version Constant

**File**: [`src/lib/shopify/client.ts`](../src/lib/shopify/client.ts:8)

```typescript
// Change this line:
const API_VERSION = '2026-01'
// To the new version:
const API_VERSION = '2026-04'
```

### Step 3: Update Query Fragments

Review all query files for deprecated field usage:

**Files to check**:
- [`src/lib/shopify/queries.ts`](../src/lib/shopify/queries.ts) — All GraphQL queries
- [`src/lib/shopify/types.ts`](../src/lib/shopify/types.ts) — TypeScript type definitions

Replace any deprecated fields with their replacements or remove them if no longer needed.

### Step 4: Run Test Suite

```bash
npm run test:run
```

Verify all existing tests pass with the new API version.

### Step 5: Update Tokenless Query Variants

If new token-gated fields were added, create corresponding tokenless variants:

1. Add new fragment without token-gated fields
2. Create `_TOKENLESS` query variant
3. Update hooks to select appropriate variant

### Step 6: Deploy to Staging

1. Deploy to staging environment
2. Verify all pages load correctly
3. Test checkout flow end-to-end
4. Monitor for GraphQL errors in logs

### Step 7: Production Deployment

1. Update production environment variables (if needed)
2. Deploy to production
3. Monitor health check page at `/_health`
4. Watch for errors in monitoring dashboard

## Deprecation Tracking Template

Use this template when reviewing each API version:

```markdown
## API Version Review: [VERSION] — [DATE]

### New Features Worth Adopting
- [ ] Feature 1: Description
- [ ] Feature 2: Description

### Deprecated Fields Used in Our Codebase
- [ ] `fieldX` → replaced by `fieldY` in queries.ts line N
- [ ] `fieldZ` → no replacement, remove from queries

### Breaking Changes
- [ ] Change description and impact

### Actions Required
- [ ] Update API_VERSION constant
- [ ] Update query fragments
- [ ] Update TypeScript types
- [ ] Add/update tokenless variants
- [ ] Run test suite
- [ ] Deploy to staging
- [ ] Deploy to production
```

## Emergency Updates

If a critical bug fix or security patch is released outside the quarterly schedule:

1. **Assess urgency**: Does it affect production functionality?
2. **Update immediately** if blocking; otherwise wait for next quarterly review
3. **Document reason** in commit message and this file

## Related Documentation

- [Shopify API Versioning](https://shopify.dev/docs/api/usage/versioning)
- [Storefront API Reference](https://shopify.dev/docs/api/storefront)
- [Remediation Plan](./remediation-plan.md)
