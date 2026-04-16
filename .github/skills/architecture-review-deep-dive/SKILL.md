---
name: architecture-review-deep-dive
description: 'Perform a thorough architecture review with MCP-first investigation, concrete recommendations, tradeoff reasoning, and a final implementation plan document. Use for system audits, refactor planning, design reviews, technical due diligence, and high-confidence architectural recommendations.'
argument-hint: 'Describe the review target, scope boundaries, risk areas, desired output path, and whether to inspect code, tests, git history, and external library docs.'
user-invocable: true
---

# Architecture Review Deep Dive

## What This Skill Produces

- An evidence-backed architecture review rather than a quick opinion.
- Concrete issues with scored severity, impact, recommended solution, reasoning, tradeoffs, and implementation steps.
- A final Markdown document using [the report template](./assets/architecture-review-template.md).

## When to Use

- You need a thorough architecture review or design audit.
- You need recommendations with concrete fixes and explicit reasoning.
- You want the agent to gather extreme depth and context before making decisions.
- You need a final document that can be handed to an implementation owner.

## Operating Rules

- Use MCPs first. Prefer structured repo, symbol, memory, reasoning, and documentation tools before shell fallback.
- Reuse before rewrite. Search for existing abstractions and patterns before proposing new ones.
- Evidence before judgment. Every major claim should be grounded in code, docs, tests, history, or external documentation.
- Score every major finding with [the severity rubric](./assets/severity-rubric.md).
- Separate confirmed facts from assumptions and open questions.
- Do not recommend large rewrites when targeted changes are sufficient.
- If the scope or output target is unclear, ask concise clarification questions before finalizing the review.

## Inputs to Capture

- Review target or subsystem.
- Decision the review is meant to support.
- Scope boundaries and exclusions.
- Desired output path for the final document.
- Risk areas to emphasize.
- Constraints such as delivery date, team capacity, compatibility, or migration limits.

If the user does not specify an output path, default to `docs/architecture-reviews/<review-name>-YYYY-MM-DD.md`.

## Procedure

1. Frame the review.
   - Confirm the review target, desired outcome, and output path.
   - If no output path is given, use `docs/architecture-reviews/<review-name>-YYYY-MM-DD.md`.
   - Determine whether the review is repo-wide or limited to a subsystem.
   - Ask only the minimum questions needed to remove ambiguity.
2. Build baseline context with MCPs.
   - Read the most relevant repo instructions and architecture docs from [repo audit sources](./references/repo-audit-sources.md).
   - Use search and symbol tools to map entry points, boundaries, data flow, integrations, configuration, and tests.
   - Read relevant memories if they exist.
   - Use sequential reasoning tools for tradeoff analysis, branching decisions, or competing hypotheses.
   - Use current library documentation tools before making framework-specific recommendations.
3. Establish the architecture model.
   - Document major runtime layers, dependencies, ownership boundaries, and data movement.
   - Identify the intended design from docs and compare it with the actual implementation.
4. Audit systematically.
   - Review module boundaries and coupling.
   - Review state management and data flow.
   - Review network and backend integration patterns.
   - Review resiliency, errors, and operational failure modes.
   - Review security and trust boundaries.
   - Review performance and scalability risks.
   - Review test coverage and verification gaps.
   - Review reuse, duplication, maintainability, and developer ergonomics.
   - Review design-system adherence and UI consistency when the target includes frontend code.
5. Write findings with a strict structure.
   - Score each finding with [the severity rubric](./assets/severity-rubric.md) before assigning a severity label.
   - Evidence: cite the implementation or documentation that supports the claim.
   - Risk: explain impact, likelihood, and blast radius.
   - Recommendation: provide a concrete solution, not a vague direction.
   - Reasoning: explain why this option is preferable and what alternatives were rejected.
   - Implementation plan: list phased steps, dependencies, migration notes, and validation.
6. Produce the final document.
   - Use [the report template](./assets/architecture-review-template.md).
   - Make the document detailed enough to guide implementation without requiring a second discovery pass.
   - Include unresolved questions and required follow-up discovery where evidence is incomplete.

## Decision Rules

- Prefer incremental, testable changes over broad rewrites.
- Prefer extending existing repo patterns over introducing parallel abstractions.
- Recommend phased migrations when blast radius is meaningful.
- Escalate contradictions between code, docs, tests, and git history instead of silently resolving them.
- For security-sensitive findings, require negative-path validation and regression testing in the recommendation.
- For completion-oriented plans, require the repo's verification bar in the implementation steps.

## Scoring Rules

- Use [the severity rubric](./assets/severity-rubric.md) for every major finding.
- Score impact, likelihood, and blast radius from 1 to 4.
- Total score equals impact + likelihood + blast radius.
- Map totals to severity bands exactly as defined in the rubric.
- Track implementation effort separately. Effort must not reduce severity.
- Rank findings by total score first, then impact, then blast radius.
- Use priority to sequence execution inside a severity band, not to redefine the severity itself.

## Finding Format

For each major finding, include these sections:

- Title
- Score breakdown
- Severity
- Implementation effort
- Recommended priority
- Evidence
- Why this is a problem
- Recommended solution
- Why this approach
- Alternatives considered
- Detailed implementation steps
- Validation
- Risks and follow-ups

## Suggested MCP Toolkit

- Search subagents for broad repo discovery.
- Symbol and structured file-reading tools for precise code understanding.
- Memory tools for established repo or user conventions.
- Sequential reasoning for tradeoff analysis and synthesis.
- Documentation lookup tools for current framework and library behavior.
- Git-aware tooling or shell fallback for historical context when needed.

## Final Deliverable Standard

- The final document must prioritize findings.
- Each recommendation must be actionable and defended with reasoning.
- The implementation section must be concrete enough for a separate agent or engineer to execute.
- The review must explicitly call out what is verified, what is inferred, and what is still unknown.