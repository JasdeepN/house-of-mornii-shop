#!/usr/bin/env bash
# git-checkpoint.sh — Stage relevant files and create an annotated checkpoint commit.
#
# Usage:
#   ./scripts/git-checkpoint.sh "<commit message summary>"
#
# Example:
#   ./scripts/git-checkpoint.sh "add AddToCartButton component"
#
# This script:
#   1. Stages tracked modifications (git add -u)
#   2. Adds .roo/, docs/, src/, public/, root markdown/config files
#   3. Creates an annotated commit with the provided summary
#   4. Prints the commit hash for use in RAG payloads
#
# Exit codes:
#   0 — Success
#   1 — No changes to stage
#   2 — Git error (not a repo, etc.)

set -euo pipefail

SUMMARY="${1:-checkpoint: auto-save}"

# Verify we are in a git repo
if ! git rev-parse --is-inside-work-tree &>/dev/null; then
  echo "ERROR: Not a git repository." >&2
  exit 2
fi

# Detect changes
CHANGES=$(git status --porcelain 2>/dev/null)
if [ -z "$CHANGES" ]; then
  echo "No changes to checkpoint."
  exit 1
fi

echo "Changes detected:"
echo "$CHANGES"
echo ""

# Stage relevant files
echo "Staging tracked modifications..."
git add -u

echo "Staging project files (.roo/, docs/, src/, public/, config)..."
git add .roo/ docs/ src/ public/ *.md package.json package-lock.json vite.config.ts tsconfig.json 2>/dev/null || true

# Get current branch and short sha for the message
BRANCH=$(git branch --show-current)
TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M UTC")

# Create annotated commit
echo "Creating commit: $SUMMARY"
git commit \
  -m "checkpoint: $SUMMARY" \
  -m "Branch: $BRANCH
Timestamp: $TIMESTAMP
Files changed: $(echo "$CHANGES" | wc -l | tr -d ' ')

$(echo "$CHANGES" | sed 's/^  /- /')"

# Print commit hash for RAG payload use
COMMIT_SHA=$(git rev-parse --short HEAD)
echo ""
echo "Checkpoint committed: $COMMIT_SHA"
echo "Branch: $BRANCH"
