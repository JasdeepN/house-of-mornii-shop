---
applyTo: "**"
description: Define the minimum verification required before marking a ticket or task done in this repository.
---

# Verification Bar Before Done

Do not mark a ticket, task, or implementation complete until the changed behavior has been validated at the appropriate level.

## Minimum bar

- Run the most targeted automated checks that exercise the changed code path.
- For backend behavior changes, prefer the narrowest relevant pytest suite or integration test.
- For frontend changes, run at least a production build or the most relevant UI test, and use both when practical.
- For security-sensitive changes, validate both the protected path and the blocked or rejected path.

## Before marking done

- Confirm the relevant tests or checks passed.
- If a check failed, fix it or explicitly state why it is unrelated and not part of the current task.
- If validation could not be run, explain the exact blocker and avoid presenting the task as fully verified.

## Reporting

- Include the validation command or task at a high level in the final summary.
- State whether the result was fully verified, partially verified, or blocked by environment/tooling issues.

## Scope

This is a hard completion gate for implementation work in this repository.