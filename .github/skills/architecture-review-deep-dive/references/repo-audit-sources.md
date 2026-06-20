# Repo Audit Sources

Use these sources first when running a deep architecture review in this repository.

## High-Signal Docs

- `CLAUDE.md`
  Use for commands, provider hierarchy, routing, Shopify integration, testing setup, and demo-mode behavior.
- `.github/copilot-instructions.md`
  Use for repo-specific architecture constraints, UI patterns, design rules, and component conventions.
- `PRD.md`
  Use to compare implemented behavior and design choices against product intent.
- `INTEGRATION_SUMMARY.md`
  Use for recent integration context and cross-system notes.
- `BAROQUE_BORDER_GUIDE.md`
  Use when UI architecture touches the ornamental border system.

## Hard Rules To Enforce During Review

- `.github/instructions/always-use-mcps.instructions.md`
  Architecture reviews in this repo should default to MCP-backed investigation.
- `.github/instructions/reuse-before-rewrite.instructions.md`
  Recommendations should extend existing patterns before proposing new abstractions.
- `.github/instructions/verification-bar-before-done.instructions.md`
  Implementation plans must include the minimum verification bar.
- `.github/instructions/security-fixes-require-regression-tests.instructions.md`
  Security recommendations should include regression-test expectations.
- `.github/instructions/ui-backend-integration-and-testing.instructions.md`
  Use when the review touches UI behavior, backend wiring, or frontend verification.

## Core Code Areas To Map Early

- `src/main.tsx`
  Provider hierarchy and application bootstrapping.
- `src/App.tsx`
  Routing, page composition, and route-level loading behavior.
- `src/context/CartContext.tsx`
  Cart state ownership, persistence, and Shopify/demo branching.
- `src/lib/shopify/`
  API wrapper, queries, hooks, demo data, and type boundaries.
- `src/components/`
  Shared UI composition, section ownership, and presentational boundaries.
- `src/components/ui/`
  Canonical primitives that should be reused rather than duplicated.
- `vite.config.ts`, `tailwind.config.js`, `vitest.config.ts`
  Tooling, alias configuration, theme loading, and test environment assumptions.
- `src/test/setup.ts`
  Testing defaults and global stubs that may affect architectural conclusions.

## Review Questions That Usually Matter Here

- Does the implementation match the documented provider and routing architecture?
- Is demo mode cleanly isolated from live Shopify behavior?
- Are shared components and design tokens reused instead of duplicated?
- Are frontend components wired through the established API and state patterns?
- Are the current tests sufficient to support the proposed refactor or fix?
- Are design-system constraints, especially OKLCH and ornamental patterns, preserved?