# Local CI/CD with `act`

Run GitHub Actions workflows locally using Docker. This eliminates the need to push to `dev` or `test` branches for every build/test iteration.

## Prerequisites

- **Docker** must be running (act uses Docker containers to simulate GitHub runners)
- **Node.js 20** installed locally (for dependency caching to work correctly)

## Quick Start

### 1. Copy secrets template

```bash
cp .local-ci/.secrets.example .local-ci/.secrets
```

Edit `.local-ci/.secrets` and fill in your actual values:

- `VITE_SHOPIFY_STORE_DOMAIN` — your-store.myshopify.com
- `VITE_SHOPIFY_STOREFRONT_TOKEN` — Storefront API public access token
- `CLOUDFLARE_API_TOKEN` — Cloudflare API token (for deploy job)
- `CLOUDFLARE_ACCOUNT_ID` — Cloudflare account ID (for deploy job)
- `GITHUB_TOKEN` — GitHub personal access token (required for `actions/checkout@v4`)

### 2. (Optional) Copy build variables template

```bash
cp .local-ci/.env.build.example .local-ci/.env.build
```

Edit `.local-ci/.env.build` with your public site configuration. These are non-secret values that affect the build output.

### 3. Run workflows

```bash
# Run the deploy workflow (triggers on push to dev branch)
act push

# Run a specific workflow
act -W .github/workflows/deploy.yml

# Dry-run: see what would happen without executing
act push --dryrun

# List available events
act list-events
```

## Common Commands Reference

| Command | Description |
|---------|-------------|
| `act push` | Simulate a push event (triggers deploy workflow) |
| `act -W .github/workflows/deploy.yml` | Run a specific workflow file |
| `act push --dryrun` | Preview steps without executing |
| `act list-workflows` | List all discovered workflows |
| `act list-events` | List available event types |
| `act -s GITHUB_TOKEN=xxx push` | Pass a secret inline (no file needed) |
| `act -e .local-ci/event.json push` | Use a custom event payload |

## Secrets Management

### Where secrets come from (in order of precedence)

1. **Inline secrets** via `-s FLAG=value` — highest priority
2. **`.local-ci/.secrets` file** — sourced automatically by act
3. **Environment variables** in the current shell session
4. **GitHub CLI** (`gh auth token`) — for `GITHUB_TOKEN` fallback

### Security notes

- `.local-ci/.secrets` is **gitignored** — never commit it
- `.local-ci/.secrets.example` is safe to commit (contains no real secrets)
- Never share or expose your `.secrets` file
- For Cloudflare deployment, you need:
  - An API Token with **Pages Edit** permission
  - Your Account ID from Cloudflare dashboard

## Performance Optimization

### Use `-b` (container architecture flag)

```bash
act push -b linux/amd64
```

Force the container architecture if you're on Apple Silicon or ARM machines. This avoids emulation overhead.

### Use `-r` (reuse containers)

```bash
act push -r
```

Reuses existing containers instead of recreating them for each step. Faster for iterative testing but may leave stale state.

### Cache considerations

The deploy workflow uses `actions/setup-node@v4` with `cache: npm`. When running locally:

- First run: downloads all dependencies (~30-60 seconds)
- Subsequent runs: uses cached `node_modules` (much faster)
- Clear cache: `rm -rf ~/.cache/act` or `docker system prune`

## act vs Self-Hosted Runner

| Feature | `act` (local Docker) | Self-Hosted Runner |
|---------|----------------------|-------------------|
| Speed | Fast for iterative testing | Slower setup, faster execution |
| Isolation | Clean Docker container each run | Persistent machine state |
| Secrets | Local file or inline | GitHub encrypted secrets |
| Network | Same as local machine | Configurable VPC/network |
| Cost | Free (your hardware) | $0.008/hr (GitHub-hosted) + your infra |
| Best for | **Development iteration** | Production deployments |

### When to use each

- **Use `act`** during development: test builds, verify workflow syntax, iterate quickly
- **Push to `dev`/`test` branches** when you need GitHub-native features (PR checks, branch protection)
- **Use self-hosted runner** for production deployments that need access to internal resources

## Troubleshooting

### Docker not running

```
Error: Failed to connect to Docker: ...
```

Start Docker Desktop or `systemctl --user start docker`.

### Port conflicts

If port 5173 (Vite dev server) is in use, act's build step may fail. Close any local dev servers before running.

### Node version mismatch

The workflow specifies `node-version: 20`. Ensure your local Docker images have Node 20 available, or add to `.actrc`:

```
-node-version=20
```

### Checkout fails with auth error

Make sure `GITHUB_TOKEN` is set in `.local-ci/.secrets` or passed via `-s GITHUB_TOKEN=ghp_your_token`.

## File Structure

```
.local-ci/
├── .actrc              # Container image mappings (committed)
├── .secrets            # Local secrets (gitignored)
├── .secrets.example    # Secrets template (committed)
├── .env.build          # Build env vars (gitignored)
├── .env.build.example  # Non-secret template (committed)
├── event.json          # Sample event payload (committed)
└── README.md           # This file
```
