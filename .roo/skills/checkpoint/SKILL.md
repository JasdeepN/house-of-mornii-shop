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
| **MCP fallback** | If any MemPalace MCP call fails (timeout, connection error, tool error), skip the entire memory sync step. Log the failure but do NOT block the commit. | Agent hangs indefinitely on slow/unavailable MCP server |
| **No sensitive files** | Never stage files that match sensitive patterns (see Sensitive File Check below). If found, abort and report them. | Accidental commit of secrets, credentials, or private data |

## Inputs required

- A brief description of what was accomplished (for the commit message and MemPalace entry)
- Current branch name (auto-detected via `git branch --show-current`)

## Workflow

### 1. Detect changes

Run `git status --porcelain` to list modified, added, and untracked files. If output is empty, report "No changes to checkpoint" and abort.

Identify which files are **relevant** (source code, docs, config, scripts). Exclude node_modules, dist/, build artifacts, and editor swap files.

### 2. Sensitive file check (MUST run before staging)

**Before staging any files, verify no sensitive or unwanted files are about to be committed.**

Run this command to see what would be staged:

```bash
git status --porcelain
```

Check for these **prohibited patterns**. If ANY match is found, **abort the checkpoint** and report which files were caught:

| Pattern category | Examples |
|------------------|----------|
| Environment files with secrets | `.env` (never `.env.local`, `.env.production`, `.env.development` — only `.env.example` is allowed) |
| Credentials / tokens | `*.pem`, `*.key`, `*.p12`, `*.pfx`, `service-account*.json` |
| OS / editor artifacts | `.DS_Store`, `Thumbs.db`, `*.swp`, `*.swo`, `*~`, `.vscode/`, `.idea/` |
| Build / dependency artifacts | `node_modules/`, `dist/`, `build/`, `*.log` |
| Untracked workspace files | `.local-ci/`, `.playwright-mcp/` (unless explicitly requested) |

If the working tree contains sensitive files that are **already tracked** in git, do NOT unstage them — just warn: `"WARNING: Sensitive file already tracked by git: <path>. Consider adding it to .gitignore for future protection."`

If no sensitive files are found, proceed to staging.

### 3. Stage and commit

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

### 4. Update or create documentation

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

```bash
# Stage documentation changes (always safe)
git add docs/ AGENTS.md README.md
```

> **Auto-amend:** If docs were staged in the previous step, automatically amend them into the checkpoint commit using `git commit --amend --no-edit`. This keeps all checkpoint-related changes in a single atomic commit. Only skip amend if the user explicitly said "separate commit for docs".

### 5. Push (ONLY with explicit user confirmation)

**NEVER auto-push.** Always ask the user first: "Push to remote? (y/n)"

If the user confirms AND the branch is tracking a remote:

```bash
git push origin $(git branch --show-current)
```

If the branch is not tracking a remote, skip push and note it to the user.

If the user declines, report: "Push skipped per your request."

## Reference

- [`scripts/git-checkpoint.sh`](scripts/git-checkpoint.sh) — Read-only reference showing the equivalent automation. Do NOT execute this script; run the git commands directly from step 3 above.

## Examples

### Checkpoint after adding a new component

```
User: "I just finished AddToCartButton, checkpoint everything"

Agent runs:
1. git status → sees AddToCartButton.tsx, AddToCartButton.test.tsx untracked
2. Sensitive check → no prohibited patterns found
3. Commits with message "checkpoint: add AddToCartButton component"
4. Updates docs/02-components.md with new component entry and stages it
5. Auto-amends docs into the checkpoint commit
6. Calls mempalace_status → succeeds, creates drawer in room "component-addtocartbutton"
7. Writes diary entry topic="checkpoint.component-addtocartbutton"
8. Asks user: "Push to remote? (y/n)" → user says y
9. Pushes if confirmed
```

### Checkpoint after architecture refactor

```
User: "Refactored the Shopify client module, checkpoint"

Agent runs:
1. git status → sees src/lib/shopify/*.ts changed
2. Sensitive check → no prohibited patterns found
3. Commits with detailed summary of changes
4. Updates docs/03-shopify-integration.md (staged)
5. Auto-amends docs into the checkpoint commit
6. Calls mempalace_status → MCP unavailable, skips memory sync entirely
7. Asks user: "Push to remote? (y/n)" → user says n
8. Reports: "Checkpoint complete. Push skipped per your request."
```

### Checkpoint with large number of changes

```
User: "I restructured the entire src/ directory, checkpoint"

Agent runs:
1. git status → sees 47 changed files
2. Sensitive check → verifies none match prohibited patterns
3. Proceeds with normal checkpoint flow (no y/n prompt needed)
4. Commits all changes in a single atomic operation
```

### Checkpoint blocked by sensitive file

```
User: "Updated credentials, checkpoint"

Agent runs:
1. git status → sees .env.production added
2. Sensitive check → catches .env.production (environment file with secrets)
3. ABORTS: "Sensitive file detected: .env.production. This file contains secrets and should not be committed. Add it to .gitignore and retry."
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
