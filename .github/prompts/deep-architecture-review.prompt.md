---
name: "Deep Architecture Review"
description: "Run a deep, MCP-first architecture review with scored findings, concrete recommendations, and a dated implementation-ready report."
argument-hint: "Describe the review target, review name, optional exclusions, and risk areas to emphasize."
agent: "agent"
---

Conduct a deep architecture review of the user's requested target.

Use the workflow in [architecture-review-deep-dive](../skills/architecture-review-deep-dive/SKILL.md), the [severity rubric](../skills/architecture-review-deep-dive/assets/severity-rubric.md), the [report template](../skills/architecture-review-deep-dive/assets/architecture-review-template.md), and the [repo source guidance](../skills/architecture-review-deep-dive/references/repo-audit-sources.md).

Requirements:

- Gather broad context with MCPs before making recommendations.
- Reuse existing abstractions and patterns before proposing new ones.
- Score every major finding with the shared severity rubric.
- Rank findings consistently and explain tradeoffs for each recommendation.
- Write the final report to `docs/architecture-reviews/<review-name>-YYYY-MM-DD.md` unless the user specifies another path.
- Include detailed implementation steps and validation for each recommendation.
- Separate verified facts, reasonable inferences, and open questions.
- End the chat response with the top findings and the most defensible next step.