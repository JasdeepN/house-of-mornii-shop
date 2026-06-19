---
name: checkpoint
description: Create a git checkpoint commit of all relevant changes, update or create documentation, and update RAG memory vectors in Qdrant. Use when saving work progress, committing feature changes, syncing codebase state to vector memory, or preparing for a branch merge. Combines git operations, doc maintenance, and rag-memory-search integration.
---

# Checkpoint

Create a complete project checkpoint: stage relevant files, commit with an annotated message, update documentation, and push changed knowledge into the RAG memory store (Qdrant).

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

- A brief description of what was accomplished (for the commit message and RAG payload)
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

### 4. Update RAG memory vectors (Qdrant)

**This is the most important step.** After the codebase changes, the RAG memory store must reflect the new state so future sessions can retrieve accurate context.

Load and follow the [`rag-memory-search`](../rag-memory-search/SKILL.md) skill for Qdrant operations. Then execute these steps:

#### 4a. Identify knowledge units to store

From the changed files, extract meaningful text chunks that an agent would need to retrieve later:

- **New/modified components:** Read the component file, extract props, purpose, and usage notes
- **Architecture changes:** Read `docs/01-architecture.md` for system-level descriptions
- **Shopify config changes:** Read `src/lib/shopify/client.ts`, `src/lib/shopify/env-schema.ts`
- **State management changes:** Read `src/context/CartContext.tsx`, relevant hooks
- **Styling changes:** Read `src/index.scss`, `src/tailwind.css`

For each knowledge unit, create a payload:

```json
{
  "id": "<unique integer or UUID>",
  "vector": <768-dim embedding>,
  "payload": {
    "text": "<concise description of the change or system state>",
    "source": "<file path or section identifier>",
    "changed_at": "2026-06-19",
    "commit": "<short sha if available>",
    "topic": "component|architecture|shopify|state|styling|testing|deployment"
  }
}
```

#### 4b. Generate embeddings and upsert

For each knowledge unit, generate an embedding via the llama.cpp text-embedding-server and upsert to Qdrant:

```bash
# Generate embedding
EMBED=$(curl -s -X POST http://localhost:8081/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model": "nomic-embed-text", "input": "<knowledge unit text>"}')

VECTOR=$(echo "$EMBED" | jq '.data[0].embedding')

# Upsert to collection (use "checkpoint-memory" or the project's existing collection)
curl -X PUT http://localhost:6333/collections/checkpoint-memory/points \
  -H "Content-Type: application/json" \
  -d "{
    \"points\": [{
      \"id\": $(date +%s),
      \"vector\": $VECTOR,
      \"payload\": {
        \"text\": \"<knowledge unit text>\",
        \"source\": \"<file path>\",
        \"changed_at\": \"$(date -u +%Y-%m-%d)\",
        \"commit\": \"$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')\",
        \"topic\": \"<topic>\"
      }
    }]
  }"
```

#### 4c. Delete stale entries (optional but recommended)

If a file was deleted or significantly rewritten, search for old entries and delete them:

```bash
# Search for old entries about the same source
OLD=$(curl -s -X POST http://localhost:6333/collections/checkpoint-memory/points/search \
  -H "Content-Type: application/json" \
  -d '{
    "vector": <query embedding>,
    "top": 5,
    "filter": {
      "must": [{"key": "source", "match": {"value": "<file path>"}}]
    }
  }')

# Delete old points if found (use the scroll/search results to get point IDs)
curl -X POST http://localhost:6333/collections/checkpoint-memory/points/delete \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "must": [
        {"key": "source", "match": {"value": "<file path>"}},
        {"key": "commit", "match": {"value": "<old commit sha>"}}
      ]
    }
  }'
```

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
4. Generates embedding for "AddToCartButton handles product quantity selection and cart addition with loading states"
5. Upserts to Qdrant checkpoint-memory collection
6. Pushes to remote
```

### Checkpoint after architecture refactor

```
User: "Refactored the Shopify client module, checkpoint"

Agent runs:
1. git status → sees src/lib/shopify/*.ts changed
2. Commits with detailed summary of changes
3. Updates docs/03-shopify-integration.md
4. Generates embeddings for architecture doc + client.ts changes
5. Upserts to Qdrant, deletes old shopify-client entries if present
6. Pushes
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `git commit` fails — nothing to commit | Run `git status --porcelain`; if empty, there is nothing to checkpoint |
| Qdrant connection refused on :6333 | Start Qdrant: `docker run -d --name qdrant -p 6333:6333 qdrant/qdrant` |
| Embedding server refused on :8081 | Ensure llama.cpp text-embedding-server is running with nomic-embed-text loaded |
| Vector dimension mismatch | nomic-embed-text outputs 768-dim; ensure collection exists with `size: 768, distance: Cosine` |
| Amend overwrites wrong commit | Verify `git log --oneline -3` before amending; the tip should be your checkpoint commit |
