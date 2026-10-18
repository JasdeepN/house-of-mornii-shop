#!/usr/bin/env bash
# Production gate: the commit being deployed must have the same tree as a `dev`
# commit whose "Deploy site" run has a successful `deploy` job. On dev that job
# includes the full end-to-end suite, so its success means this exact code passed
# it. The run's other job, `preview` (#62), does not count: it checks the
# production catalogue behind Access, not the code.
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

runs="$(gh api "/repos/${repo}/actions/workflows/deploy-site.yml/runs?branch=dev&per_page=30" \
  --jq '.workflow_runs[] | "\(.id) \(.head_sha)"')"

while read -r id sha; do
  [ -n "${sha:-}" ] || continue
  git cat-file -e "${sha}^{commit}" 2>/dev/null || git fetch --quiet --depth=1 origin "$sha" 2>/dev/null || continue
  [ "$(git rev-parse "${sha}^{tree}")" = "$tree" ] || continue
  conclusion="$(gh api "/repos/${repo}/actions/runs/${id}/jobs?per_page=100" \
    --jq '[.jobs[] | select(.name == "deploy")][0].conclusion // ""')"
  if [ "$conclusion" = "success" ]; then
    echo "Gate passed: matches dev commit $sha, whose Deploy site deploy job (with the end-to-end suite) succeeded."
    exit 0
  fi
done <<< "$runs"

echo "::error::Production deploys only code whose end-to-end run passed on dev: merge a dev commit whose Deploy site deploy job is green."
exit 1
