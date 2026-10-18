#!/usr/bin/env bash
# Production gate: the commit being deployed must have the same tree as a `dev`
# commit whose "Deploy site" run concluded success. On dev that run includes the
# full end-to-end suite, so a green run means this exact code passed it.
# Comparing trees (not SHAs) lets `dev` reach `main` by fast-forward or by a
# merge commit that changes nothing.
#
# Needs: gh (GH_TOKEN), git with an `origin` remote, `actions: read`.
# GATE_REF overrides the commit to check (default HEAD), for dry runs.
set -euo pipefail

ref="${GATE_REF:-HEAD}"
repo="${GITHUB_REPOSITORY:-$(gh repo view --json nameWithOwner --jq .nameWithOwner)}"
tree="$(git rev-parse "${ref}^{tree}")"
echo "Checking tree $tree of $(git rev-parse --short "$ref")"

shas="$(gh api "/repos/${repo}/actions/workflows/deploy-site.yml/runs?branch=dev&status=success&per_page=30" \
  --jq '.workflow_runs[].head_sha' | awk '!seen[$0]++')"

for sha in $shas; do
  git cat-file -e "${sha}^{commit}" 2>/dev/null || git fetch --quiet --depth=1 origin "$sha" 2>/dev/null || continue
  if [ "$(git rev-parse "${sha}^{tree}")" = "$tree" ]; then
    echo "Gate passed: matches dev commit $sha, whose Deploy site run succeeded."
    exit 0
  fi
done

echo "::error::Production deploys only code whose end-to-end run passed on dev: merge a dev commit with a green Deploy site run."
exit 1
