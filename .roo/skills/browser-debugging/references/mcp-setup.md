# MCP Server Configuration

## Prerequisites

Install the Chrome DevTools MCP server:

```bash
npm install -g @anthropic-ai/chrome-devtools-mcp
# or
npx @anthropic-ai/chrome-devtools-mcp
```

## Configuration

Add to `.roo/mcp.json`:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["@anthropic-ai/chrome-devtools-mcp"],
      "env": {
        "CHROME_PATH": "/usr/bin/google-chrome-stable",
        "DEBUG_PORT": "9222"
      }
    }
  }
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CHROME_PATH` | auto-detected | Path to Chrome/Chromium binary |
| `DEBUG_PORT` | `9222` | DevTools remote debugging port |
| `TARGET_URL` | `about:blank` | Initial page to navigate to |

## Verification

After configuring, verify the MCP server connects:

```bash
# Check Chrome is responding
curl http://localhost:9222/json/version

# Expected response:
# {
#   "Browser": "Chrome/...",
#   "webSocketDebuggerUrl": "ws://localhost:9222/devtools/browser/..."
# }
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `ECONNREFUSED localhost:9222` | Chrome not launched; run `chrome-dev.sh --port 9222` |
| MCP server fails to start | Verify `npx @anthropic-ai/chrome-devtools-mcp --help` works |
| Permission denied on Chrome | Add `--no-sandbox` flag or use `chromium-browser` |
| Port conflict | Use `lsof -ti:9222 \| xargs kill` to free the port |
