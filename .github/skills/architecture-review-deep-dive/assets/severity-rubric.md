# Severity Rubric

Use this rubric to score every major architecture finding consistently.

## Scoring Model

Score each finding on three dimensions from 1 to 4:

- Impact
- Likelihood
- Blast radius

Total score = Impact + Likelihood + Blast radius.

Do not average scores. Do not reduce severity because remediation is difficult. Track effort separately.

## Dimension Definitions

| Dimension | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| Impact | Localized code quality or developer friction with no meaningful user impact | User-visible degradation or workaround on a non-critical path | Breaks correctness, resilience, or a primary workflow | Security exposure, data loss or corruption risk, revenue-blocking failure, or irreversible state risk |
| Likelihood | Requires rare preconditions or unusual misuse | Plausible but mostly edge-case behavior | Likely to recur under normal growth, maintenance, or usage | Already occurring, easy to trigger, or intrinsic to the current design |
| Blast radius | Isolated file, component, or route | One feature or bounded subsystem | Multiple features, shared services, or common paths | App-wide, cross-system, or customer-wide impact |

## Severity Bands

| Total Score | Severity |
|---|---|
| 11-12 | Critical |
| 8-10 | High |
| 5-7 | Medium |
| 3-4 | Low |

## Overrides

- Minimum `High` when the finding affects authentication, authorization, payments, data integrity, or a core purchase path.
- Force `Critical` when the issue is already causing production failure, active exploitability, or credible irreversible data loss.
- If evidence is incomplete, state the uncertainty explicitly instead of inflating the score.

## Effort and Priority

Track effort separately from severity:

- `S`: small, localized change with low migration risk
- `M`: moderate cross-file or cross-module change
- `L`: large refactor, migration, or cross-team coordination

Use priority to order work inside a severity band:

- `P0`: do immediately
- `P1`: next planned work
- `P2`: important but can follow major risks
- `P3`: opportunistic or backlog work

## Ranking Rules

1. Sort findings by total score descending.
2. Break ties using higher impact first.
3. If still tied, use higher blast radius first.
4. Use effort and dependency ordering only after severity ranking is stable.