---
name: checkpoint
description: Create a git checkpoint commit of all relevant changes, update documentation, and write session notes to MemPalace memory. Use when saving work progress, committing feature changes, syncing codebase state to vector memory, or preparing for a branch merge. Combines git operations, doc maintenance, and MemPalace MCP integration.
---

# Checkpoint

Create a complete project checkpoint: stage relevant files, commit with an annotated message, update documentation, and write session notes to MemPalace memory.

## When to use

- After completing a meaningful unit of work (feature, fix, refactor)
- Before switching branches or taking on a new task
- When the user asks to "checkpoint", "save progress", "commit everything", or "sync state"
- After updating docs, components, hooks, lib code, or configuration files

## When NOT to use

- There are no changes to stage (`git status --porcelain` is empty)
- The working tree has uncommitted work the user explicitly wants to keep separate
- You are in a detached HEAD state without a clear branch target (ask first)

## SAFETY GATES (MUST FOLLOW BEFORE ANY STEP)

These gates prevent breaking the agentic flow. Violating them can corrupt parallel sessions, trigger premature CI/CD, or leave the repo in an inconsistent state.

| Gate | Rule | Consequence if violated |
|------|------|------------------------|
| **No auto-push** | Never run `git push` without explicit user confirmation. Ask: "Push to remote? (y/n)" | Premature CI/CD triggers, conflicts with parallel agents, breaks rebasing workflows |
| **No auto-amend** | Never use `git commit --amend` unless the user explicitly says "amend" or "rewrite". Amending rewrites history and can corrupt parallel agent working copies. | History divergence, force-push conflicts, broken agent sessions |
| **MCP fallback** | If any MemPalace MCP call fails (timeout, connection error, tool error), skip the entire memory sync step. Log the failure but do NOT block the commit. | Agent hangs indefinitely on slow/unavailable MCP server |
| **Large change confirmation** | If `git status --porcelain` reports more than 10 changed files, list them and ask: "Checkpointing N files. Continue? (y/n)" | Accidental mass-commit of unrelated work |

## Inputs required

- A brief description of what was accomplished (for the commit message and MemPalace entry)
- Current branch name (auto-detected via `git branch --show-current`)
- **User confirmation for push/amend** — these are opt-in, not automatic

## Workflow

### 1. Detect changes

Run `git status --porcelain` to list modified, added, and untracked files. If output is empty, report "No changes to checkpoint" and abort.

Identify which files are **relevant** (source code, docs, config, scripts). Exclude node_modules, dist/, build artifacts, and editor swap files.

### 2. Stage and commit

**Run these commands directly — do not read the script as reference.** Execute each command in order:

```bash
# Stage tracked modifications (deleted/modified files)
git add -u

# Stage project files (new untracked + modified)
git add .roo/ docs/ src/ public/ *.md package.json package-lock.json vite.config.ts tsconfig.json 2>/dev/null || true

# Create annotated commit — replace <brief description> with actual summary
git commit -m "checkpoint: <brief description>" -m "<summary of what changed and why>"
```

Commit message format:
- **First line:** `checkpoint: <one-line summary>`
- **Body:** 2–4 bullet points describing what changed, which files are affected, and the impact

### 3. Update or create documentation

If any of these areas changed, ensure docs reflect the update:

| Area | Doc to update |
|------|---------------|
| Architecture changes | `docs/01-architecture.md` |
| New/modified components | `docs/02-components.md` |
| Shopify integration changes | `docs/03-shopify-integration.md` |
| State management changes | `docs/04-state-management.md` |
| Styling system changes | `docs/05-styling-system.md` |
| Testing changes | `docs/06-testing.md` |
| Deployment changes | `docs/07-deployment.md` |
| General project info | `AGENTS.md`, `README.md`, `docs/00-index.md` |

For each updated doc:
1. Read the existing file
2. Add or update the relevant section with a date-stamped entry
3. Stage the docs

**Amend decision:** Only use `git commit --amend` if the user explicitly requests it. Otherwise, stage docs separately and let the user decide whether to amend or create a new commit.

```bash
# Stage documentation changes (always safe)
git add docs/ AGENTS.md README.md

# ONLY if user explicitly says "amend":
# git commit --amend --no-edit

# Otherwise, leave staged for user to decide:
# - Commit separately: git commit -m "docs: update documentation"
# - Or amend the existing commit manually
```

### 4. Update MemPalace memory (OPTIONAL — skip if MCP unavailable)

After the codebase changes, update MemPalace memory so future sessions can retrieve accurate context. **This step is non-blocking.** If any MCP call fails, skip the entire step and continue to step 5.

> **Context retrieval is NOT automatic.** The agent must explicitly call MemPalace MCP tools (`mempalace_status`, `mempalace_search`, `mempalace_kg_query`, `mempalace_add_drawer`, `mempalace_diary_write`) to interact with memory. There is no automatic context injection into the system prompt.

#### 4a. Test MCP connectivity first

Before attempting any memory operations, verify the MCP server responds:

```
Call mempalace_status → if it returns within 5 seconds, proceed; otherwise skip entire step 4
```

If `mempalace_status` fails or times out:
1. Log: "MemPalace MCP unavailable — skipping memory sync"
2. **Do NOT attempt any further MemPalace calls**
3. Proceed directly to step 5

#### 4b. Load palace overview (only if MCP is reachable)

Start by calling `mempalace_status` to load the palace overview and check current state:

```
Call mempalace_status → review total_drawers, wings, rooms
```

#### 4c. Identify knowledge units to store (only if MCP is reachable)

- **New/modified components:** Read the component file, summarize props, purpose, and usage notes
- **Architecture changes:** Read `docs/01-architecture.md` for system-level descriptions
- **Shopify config changes:** Read `src/lib/shopify/client.ts`, `src/lib/shopify/env-schema.ts`
- **State management changes:** Read `src/context/CartContext.tsx`, relevant hooks
- **Styling changes:** Read `src/index.scss`, `src/tailwind.css`

#### 4d. File content into organized rooms (only if MCP is reachable)

```
# Create a new drawer in a named room
Call mempalace_add_drawer with wing="house_of_mornii_shop", room="<room-name>", content="<summarized knowledge>"
```

**Room naming convention:** Use hyphenated slugs that describe the topic:
- `project-overview` — stack, modes, env vars, deployment
- `architecture` — directory structure, patterns, state management
- `key-gotchas` — storage keys, conventions, gotchas
- `shopify-integration` — API details, scopes, auth setup
- `component-<name>` — individual component documentation

#### 4e. Add knowledge graph facts (optional but recommended, only if MCP is reachable)

```
# Add a fact to the knowledge graph
Call mempalace_kg_add with subject, predicate, object, valid_from
```

Example facts to add after significant changes:
- `House of Mornii Shop → uses → <new dependency>` (if stack changed)
- `House of Mornii Shop → has → <new feature count>` (if component count changed)
- `House of Mornii Shop → deployed_to → <platform>` (if deployment target changed)

#### 4f. Write session diary entry (only if MCP is reachable)

```
Call mempalace_diary_write with:
- agent_name: "mempalace"
- topic: "checkpoint.<brief-topic>"
- entry: "SESSION:<date> | palace.sync.<project> | ALC.req:checkpoint | <stars> | <summary of what changed, what was stored, key learnings>"
```

**Entry format:** `SESSION:<date> | palace.sync.<project> | <action description> | ★★★ | <details>`

Importance levels: ★ (minor), ★★ (moderate), ★★★ (significant), ★★★★ (major), ★★★★★ (critical)

### 5. Push (ONLY with explicit user confirmation)

**NEVER auto-push.** Always ask the user first: "Push to remote? (y/n)"

If the user confirms AND the branch is tracking a remote:

```bash
git push origin $(git branch --show-current)
```

If the branch is not tracking a remote, skip push and note it to the user.

If the user declines, report: "Push skipped per your request."

## Reference

- [`scripts/git-checkpoint.sh`](scripts/git-checkpoint.sh) — Read-only reference showing the equivalent automation. Do NOT execute this script; run the git commands directly from step 2 above.

## Examples

### Checkpoint after adding a new component

```
User: "I just finished AddToCartButton, checkpoint everything"

Agent runs:
1. git status → sees AddToCartButton.tsx, AddToCartButton.test.tsx staged
2. Commits with message "checkpoint: add AddToCartButton component"
3. Updates docs/02-components.md with new component entry (staged but NOT amended)
4. Asks user: "Amend docs into this commit? (y/n)" → user says y
5. Calls mempalace_status → succeeds, creates drawer in room "component-addtocartbutton"
6. Writes diary entry topic="checkpoint.component-addtocartbutton"
7. Asks user: "Push to remote? (y/n)" → user says y
8. Pushes if confirmed
```

### Checkpoint after architecture refactor

```
User: "Refactored the Shopify client module, checkpoint"

Agent runs:
1. git status → sees src/lib/shopify/*.ts changed
2. Commits with detailed summary of changes
3. Updates docs/03-shopify-integration.md (staged)
4. Asks user: "Amend docs into this commit? (y/n)" → user says n
5. Calls mempalace_status → MCP unavailable, skips memory sync entirely
6. Asks user: "Push to remote? (y/n)" → user says n
7. Reports: "Checkpoint complete. Push skipped per your request."
```

### Checkpoint with large number of changes

```
User: "I restructured the entire src/ directory, checkpoint"

Agent runs:
1. git status → sees 47 changed files
2. SAFETY GATE: Lists changed file categories and asks: "Checkpointing 47 files. Continue? (y/n)"
3. User confirms
4. Proceeds with normal checkpoint flow
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `git commit` fails — nothing to commit | Run `git status --porcelain`; if empty, there is nothing to checkpoint |
| MemPalace MCP tool call fails | Ensure MemPalace MCP server is configured in `.vscode-server/data/User/globalStorage/zoocodeorganization.zoo-code/settings/mcp_settings.json` and running |
| Palace has too many drawers in "general" | Create named rooms (e.g., `project-overview`, `architecture`) instead of filing everything in "general" |
| KG facts not appearing | Verify `mempalace_kg_add` returned success; check with `mempalace_kg_stats` |
| Diary entry not saved | Check `mempalace_diary_write` response for entry_id; verify wing name matches |
| Amend overwrites wrong commit | Verify `git log --oneline -3` before amending; the tip should be your checkpoint commit |
