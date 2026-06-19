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

## Inputs required

- A brief description of what was accomplished (for the commit message and MemPalace entry)
- Current branch name (auto-detected via `git branch --show-current`)

## Workflow

### 1. Detect changes

Run `git status --porcelain` to list modified, added, and untracked files. If output is empty, report "No changes to checkpoint" and abort.

Identify which files are **relevant** (source code, docs, config, scripts). Exclude node_modules, dist/, build artifacts, and editor swap files.

### 2. Stage and commit

Execute the helper script or run equivalent commands manually:

```bash
# Stage relevant changes
git add -u
git add .roo/ docs/ src/ public/ *.md package.json package-lock.json vite.config.ts tsconfig.json

# Create annotated commit
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
3. Stage and amend into the same commit (do NOT create a second commit)

```bash
git add docs/ AGENTS.md README.md
git commit --amend --no-edit
```

### 4. Update MemPalace memory

**This is the most important step.** After the codebase changes, the MemPalace memory must reflect the new state so future sessions can retrieve accurate context.

> **Context retrieval is NOT automatic.** The agent must explicitly call MemPalace MCP tools (`mempalace_status`, `mempalace_search`, `mempalace_kg_query`, `mempalace_add_drawer`, `mempalace_diary_write`) to interact with memory. There is no automatic context injection into the system prompt.

#### 4a. Load palace overview

Start by calling `mempalace_status` to load the palace overview and check current state:

```
Call mempalace_status → review total_drawers, wings, rooms
```

#### 4b. Identify knowledge units to store

From the changed files, extract meaningful content for MemPalace drawers:

- **New/modified components:** Read the component file, summarize props, purpose, and usage notes
- **Architecture changes:** Read `docs/01-architecture.md` for system-level descriptions
- **Shopify config changes:** Read `src/lib/shopify/client.ts`, `src/lib/shopify/env-schema.ts`
- **State management changes:** Read `src/context/CartContext.tsx`, relevant hooks
- **Styling changes:** Read `src/index.scss`, `src/tailwind.css`

#### 4c. File content into organized rooms

Create or update drawers in named rooms (not "general") for structured retrieval:

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

#### 4d. Add knowledge graph facts (optional but recommended)

For structured facts that should be queryable via KG:

```
# Add a fact to the knowledge graph
Call mempalace_kg_add with subject, predicate, object, valid_from
```

Example facts to add after significant changes:
- `House of Mornii Shop → uses → <new dependency>` (if stack changed)
- `House of Mornii Shop → has → <new feature count>` (if component count changed)
- `House of Mornii Shop → deployed_to → <platform>` (if deployment target changed)

#### 4e. Write session diary entry

Record what happened in this checkpoint session:

```
Call mempalace_diary_write with:
- agent_name: "mempalace"
- topic: "checkpoint.<brief-topic>"
- entry: "SESSION:<date> | palace.sync.<project> | ALC.req:checkpoint | <stars> | <summary of what changed, what was stored, key learnings>"
```

**Entry format:** `SESSION:<date> | palace.sync.<project> | <action description> | ★★★ | <details>`

Importance levels: ★ (minor), ★★ (moderate), ★★★ (significant), ★★★★ (major), ★★★★★ (critical)

### 5. Push (if on a tracked branch)

```bash
git push origin $(git branch --show-current)
```

If the branch is not tracking a remote, skip push and note it to the user.

## Files

- [`scripts/git-checkpoint.sh`](scripts/git-checkpoint.sh) — Execute this script to automate steps 1–2 (stage + commit). Read it to understand what it does.

## Examples

### Checkpoint after adding a new component

```
User: "I just finished AddToCartButton, checkpoint everything"

Agent runs:
1. git status → sees AddToCartButton.tsx, AddToCartButton.test.tsx staged
2. Commits with message "checkpoint: add AddToCartButton component"
3. Updates docs/02-components.md with new component entry
4. Calls mempalace_status to check palace state
5. Creates drawer in room "component-addtocartbutton" with component summary
6. Writes diary entry topic="checkpoint.component-addtocartbutton"
7. Pushes to remote
```

### Checkpoint after architecture refactor

```
User: "Refactored the Shopify client module, checkpoint"

Agent runs:
1. git status → sees src/lib/shopify/*.ts changed
2. Commits with detailed summary of changes
3. Updates docs/03-shopify-integration.md
4. Calls mempalace_status, then creates/updates drawers in "shopify-integration" room
5. Adds KG facts if stack/deployment changed
6. Writes diary entry topic="checkpoint.shopify-refactor"
7. Pushes
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
