---
applyTo: "ui/**"
description: All UI components must wire to real backend endpoints via lib/ helpers, handle all response states, and be covered by integration or E2E tests. No mock-only or disconnected UI.
---

# UI Must Connect to Backend and Be Tested

A UI feature is not done until it is wired to a real API endpoint, handles every observable response state, and has passing automated test coverage. Stub data, hardcoded responses, and untested components are defects.

## API connection requirements

- Every list, detail view, form submission, and action button must call a real backend endpoint — no hardcoded arrays, static fixtures, or `TODO: connect API` comments in shipped code.
- All API calls go through functions in `ui/lib/`. If no helper exists for the required endpoint, add one before writing the component — not after.
- Handle all four observable states explicitly in the component: **loading**, **error**, **empty**, **populated**. A component that only handles the happy path is incomplete.
- Do not swallow errors with empty `catch` blocks. Surface a user-readable message and, where applicable, a retry action.
- Pagination, search, and filter controls must drive real query parameters against the backend. Client-side filtering of a full server response is only acceptable when the total dataset is provably small (≤ 50 items) and documented as such.

## State management for async data

- Use `useState` + `useEffect` (or an SWR/React Query hook if already in use in the file) for data fetching. Pick the pattern already used in the nearest neighboring component.
- Show a `Spinner` (from `ui/components/ui/Spinner.tsx`) during the loading state — not an empty shell or a hidden layout shift.
- On error, render an error surface with the error message from the API response body (`detail` field for FastAPI errors) and a retry button that re-fires the request.
- On empty, render a styled empty state (icon + message + optional CTA) — never a blank page.

## Testing requirements

Every UI feature must have test coverage at the most appropriate layer:

### Component / unit tests
- Required for all form validation logic, conditional rendering based on props/state, and any helper function in `ui/lib/`.
- Mock the API layer (not the component fetch logic) using `msw` or `jest.fn()`.

### Integration tests (Playwright E2E)
- Required for any new page, modal workflow, or multi-step user flow.
- Tests must use the dev server against the real backend (or a fully-seeded test database) — not mock API responses, unless the backend is unavailable in CI.
- Test the full user journey: navigate to the feature → trigger the action → assert the correct outcome is visible in the UI.
- Include at least one negative case: what happens when the API returns an error, the input is invalid, or the user lacks permission.

### Auth and permission coverage
- If a page or action requires a specific role, add a Playwright test that verifies an unauthorized user sees the correct access-denied state, not the feature content.

## Verification gate

A UI task is not complete until:

- [ ] The component renders correctly with real backend data (not fixture JSON)
- [ ] Loading, error, and empty states are all visually verified
- [ ] At least one positive-path Playwright test passes for the main user journey
- [ ] At least one negative-path test passes (error state, unauthorized access, or invalid input)
- [ ] `npm run build` produces zero TypeScript errors

## Scope

Applies to all files under `ui/`. Violations (disconnected UI, missing states, zero test coverage) are blocking issues that must be resolved before marking a feature or ticket done.
