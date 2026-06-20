---
applyTo: "**"
description: Standardize how Plane is updated after implementation using REST API curl commands (not Plane MCP), including a built-in command guide.
---

# Update Plane After Implementation

Use Plane REST API (curl + `X-API-Key`) to record implementation progress once code changes and validation have reached a meaningful checkpoint.

## Hard rule

- Do not use Plane MCP tools for ticket operations in this repository.
- Use REST API calls with `curl -H "X-API-Key: plane_api_f8584e63337f412889c44633ad762a5a"`.

## Plane REST API quick guide

Use these commands directly so no endpoint lookup is needed.

> **Path rules for this instance:**
> - Workspace slug: `projects` (string slug, not UUID)
> - Project: must use the **UUID** `f3841b85-542b-4de0-a2eb-102b52c3cabc` — the slug alone returns 404
> - Resource name: `work-items` (not `issues`)
> - Cycle work items sub-resource: `cycle-issues/`
> - Work item relations (blocking links): REST endpoint returns errors — use Plane MCP tools instead

```bash
# Required constants
PLANE_API_KEY="plane_api_f8584e63337f412889c44633ad762a5a"
PLANE_BASE="https://plane.server.lan/api/v1"
WORKSPACE="projects"
PROJECT_ID="f3841b85-542b-4de0-a2eb-102b52c3cabc"

# Optional for self-signed certs in this environment
TLS="-k"

# Known state IDs (no lookup needed)
STATE_BACKLOG="f9dbd960-78df-47bd-86b6-02de486ff4fd"
STATE_TODO="73c8673d-2353-480e-92f2-09941ce67514"
STATE_IN_PROGRESS="dcb84e31-1546-4e37-b530-299723df2218"
STATE_DONE="659ed5b2-e8f2-4f47-86a7-d65120741075"
STATE_CANCELLED="741311aa-d83e-41d7-ac35-d8e70adc5c8d"

# 1) List work items in project
curl ${TLS} -sS -H "X-API-Key: ${PLANE_API_KEY}" \
	"${PLANE_BASE}/workspaces/${WORKSPACE}/projects/${PROJECT_ID}/work-items/?per_page=50"

# 2) Get a single work item by UUID
curl ${TLS} -sS -H "X-API-Key: ${PLANE_API_KEY}" \
	"${PLANE_BASE}/workspaces/${WORKSPACE}/projects/${PROJECT_ID}/work-items/<ISSUE_UUID>/"

# 3) Add progress comment to a work item
curl ${TLS} -sS -X POST -H "X-API-Key: ${PLANE_API_KEY}" \
	-H "Content-Type: application/json" \
	-d '{"comment_html":"<p>Implemented and validated. See test results in task summary.</p>"}' \
	"${PLANE_BASE}/workspaces/${WORKSPACE}/projects/${PROJECT_ID}/work-items/<ISSUE_UUID>/comments/"

# 4) Move work item state (use known state IDs above)
curl ${TLS} -sS -X PATCH -H "X-API-Key: ${PLANE_API_KEY}" \
	-H "Content-Type: application/json" \
	-d '{"state":"<STATE_ID>"}' \
	"${PLANE_BASE}/workspaces/${WORKSPACE}/projects/${PROJECT_ID}/work-items/<ISSUE_UUID>/"

# 5) Create a work item
curl ${TLS} -sS -X POST -H "X-API-Key: ${PLANE_API_KEY}" \
	-H "Content-Type: application/json" \
	-d '{"name":"Implement: example task","description_html":"<p>Scope and acceptance criteria.</p>","priority":"medium","state":"<STATE_ID>"}' \
	"${PLANE_BASE}/workspaces/${WORKSPACE}/projects/${PROJECT_ID}/work-items/"

# 6) Update work item fields (title/description/priority/state)
curl ${TLS} -sS -X PATCH -H "X-API-Key: ${PLANE_API_KEY}" \
	-H "Content-Type: application/json" \
	-d '{"name":"Implement: refined title","description_html":"<p>Updated scope.</p>","priority":"high"}' \
	"${PLANE_BASE}/workspaces/${WORKSPACE}/projects/${PROJECT_ID}/work-items/<ISSUE_UUID>/"

# 7) List project states (verify IDs if needed)
curl ${TLS} -sS -H "X-API-Key: ${PLANE_API_KEY}" \
	"${PLANE_BASE}/workspaces/${WORKSPACE}/projects/${PROJECT_ID}/states/"

# 8) List cycles
curl ${TLS} -sS -H "X-API-Key: ${PLANE_API_KEY}" \
	"${PLANE_BASE}/workspaces/${WORKSPACE}/projects/${PROJECT_ID}/cycles/"

# 8a) Create a cycle with an explicit goal and success criteria
curl ${TLS} -sS -X POST -H "X-API-Key: ${PLANE_API_KEY}" \
	-H "Content-Type: application/json" \
	-d '{"name":"Sprint X — Theme","description_html":"<p><strong>Goal:</strong> One sentence outcome for the sprint.</p><p><strong>Non-goals:</strong> Explicit exclusions for this cycle.</p><p><strong>Success criteria:</strong></p><ul><li>Criterion 1 with observable evidence</li><li>Criterion 2 with observable evidence</li></ul>","start_date":"2026-04-01T00:00:00Z","end_date":"2026-04-14T23:59:00Z"}' \
	"${PLANE_BASE}/workspaces/${WORKSPACE}/projects/${PROJECT_ID}/cycles/"

# 8b) Update an existing cycle description when success criteria were omitted initially
curl ${TLS} -sS -X PATCH -H "X-API-Key: ${PLANE_API_KEY}" \
	-H "Content-Type: application/json" \
	-d '{"description_html":"<p><strong>Goal:</strong> One sentence outcome for the sprint.</p><p><strong>Non-goals:</strong> Explicit exclusions for this cycle.</p><p><strong>Success criteria:</strong></p><ul><li>Criterion 1 with observable evidence</li><li>Criterion 2 with observable evidence</li></ul>"}' \
	"${PLANE_BASE}/workspaces/${WORKSPACE}/projects/${PROJECT_ID}/cycles/<CYCLE_UUID>/"

# 9) List work items in a cycle
curl ${TLS} -sS -H "X-API-Key: ${PLANE_API_KEY}" \
	"${PLANE_BASE}/workspaces/${WORKSPACE}/projects/${PROJECT_ID}/cycles/<CYCLE_UUID>/cycle-issues/"

# 10) Add work items to a cycle
curl ${TLS} -sS -X POST -H "X-API-Key: ${PLANE_API_KEY}" \
	-H "Content-Type: application/json" \
	-d '{"issues":["<ISSUE_UUID_1>","<ISSUE_UUID_2>"]}' \
	"${PLANE_BASE}/workspaces/${WORKSPACE}/projects/${PROJECT_ID}/cycles/<CYCLE_UUID>/cycle-issues/"

# 11) Optional external URL links attached to a work item
curl ${TLS} -sS -X POST -H "X-API-Key: ${PLANE_API_KEY}" \
	-H "Content-Type: application/json" \
	-d '{"url":"https://github.com/org/repo/pull/123","title":"Implementation PR"}' \
	"${PLANE_BASE}/workspaces/${WORKSPACE}/projects/${PROJECT_ID}/work-items/<ISSUE_UUID>/links/"

# 12) Blocking/dependency relations — REST endpoint does not work on this instance.
#     Use Plane MCP tools instead:
#       mcp__plane__create_work_item_relation(project_id, work_item_id, relation_type, issues)
#       relation_type: "blocked_by" | "blocking" | "duplicate_of" | "relates_to"
```

## Required Plane workflow steps

1. Resolve target issue UUID from search/list output before making updates.
2. Move issue to `In Progress` when implementation starts.
3. Post progress comments at meaningful checkpoints (code complete, validation complete, blocked).
4. Patch issue fields when scope/priority/title changed during implementation.
5. Create/update blocker links for related tickets so dependency chains are explicit.
6. Move issue to `Done` only after verification bar is met.
7. Confirm state transition and link updates with follow-up GET calls.

## Required cycle metadata for future sprints

- Do not create a new cycle with an empty description.
- Every new cycle description must include all three sections:
	- `Goal` — the primary outcome the sprint is intended to deliver
	- `Non-goals` — what the sprint is intentionally not trying to finish
	- `Success criteria` — concrete conditions that let a retrospective say the cycle succeeded or failed without inferring from ticket counts alone
- When work is added to a cycle that was created without these sections, patch the cycle description before calling the cycle ready for execution.
- Retrospectives should judge the cycle first against the written `Success criteria`, then against ticket completion as a secondary signal.

## Linking semantics (blocking chain)

- Research blocks Implementation.
- Implementation blocks Docs.
- Use work item UUIDs for all relation operations, not AIAGENT sequence IDs.
- The REST API relations endpoint does not work on this instance — use Plane MCP tools for blocking/dependency links:
  ```
  mcp__plane__create_work_item_relation(
    project_id="f3841b85-542b-4de0-a2eb-102b52c3cabc",
    work_item_id="<BLOCKED_UUID>",
    relation_type="blocked_by",
    issues=["<BLOCKER_UUID>"]
  )
  ```
- If MCP relation tools also fail (HTTP 404), record the intended blocking chain in a comment on both tickets.

## Required timing

- Update the related Plane ticket after the implementation is complete and the relevant validation has finished.
- Create a git commit for the completed implementation once the relevant validation has passed and before ending the task.
- Add a progress comment before ending the task when code was changed, even if the ticket cannot yet be moved to Done.
- Move the ticket to Done only after the verification bar has been met.
- Move to `In Progress` at implementation start for active work.
- Keep dependency links current when ticket ordering changes.

## Commit requirement

- Do not leave completed ticket work uncommitted.
- After validation succeeds, create at least one non-interactive git commit that captures the completed work before considering the ticket done.
- Reference the Plane issue ID in the commit message when one exists.
- If a commit cannot be created, report the blocker explicitly and do not present the ticket as complete.

## Required comment contents

- Summarize the behavior change or fix in plain language.
- Mention the main code areas changed at a high level.
- Record the validation that was run and the outcome.
- Note the commit hash if a commit was created, or explain why a commit could not be created.
- Note any remaining blockers, follow-ups, or reasons the ticket was not closed.

## Failure handling

- If Plane is unavailable or permission is denied, say so explicitly in the user-facing summary.
- Do not claim the ticket was updated when the Plane operation failed.
- If a REST call fails, include the HTTP status and endpoint used in the user-facing summary.
- If state/link update fails, leave an issue comment noting the blocker and do not claim closure.

## Scope

This applies to ticket-driven work in this repository unless the user explicitly asks not to update Plane.