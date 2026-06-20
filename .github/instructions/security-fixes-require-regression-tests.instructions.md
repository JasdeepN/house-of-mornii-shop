---
applyTo: "**"
description: Make regression-test additions the default expectation for security fixes in this repository.
---

# Security Fixes Require Regression Tests

When fixing a security issue, add automated regression coverage by default.

## Default expectation

- Add or update tests that reproduce the vulnerable input, access pattern, or workflow that motivated the fix.
- Prefer the closest realistic layer for the regression: integration or end-to-end for auth, RBAC, path traversal, import/export, and other boundary security issues.
- Include at least one negative case that proves the exploit is blocked.
- When relevant, include a positive authorized or valid-input case to show intended behavior still works.

## Exceptions

- Only skip regression coverage when the repository cannot practically test the fix at the correct layer.
- If coverage is skipped, explain why and add the nearest useful automated test instead.

## Verification

- Run the new or updated regression tests as part of the verification step.
- Do not treat a security fix as complete if the regression coverage has not been validated or explicitly justified.

## Scope

This applies to security bugs, auth and RBAC changes, path validation fixes, input hardening, sandbox escapes, and similar risk-reduction work.