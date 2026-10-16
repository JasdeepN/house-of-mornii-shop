---
name: browser-debugging
description: Debug web applications in a real browser using Chrome DevTools MCP server. Use when inspecting DOM, debugging network requests, tracing JavaScript errors, capturing console logs, taking screenshots, auditing performance, or diagnosing UI bugs in a live browser session. Includes launching Chrome with remote debugging enabled via CLI.
---

# Browser Debugging with Chrome DevTools MCP

Debug web applications using the Chrome DevTools Protocol (CDP) via an MCP server connection.

## When to use

- Inspecting live DOM state and CSS applied to elements
- Debugging network requests (failed XHR/fetch, slow responses, CORS errors)
- Tracing JavaScript runtime errors in the browser console
- Capturing screenshots or recording page interactions
- Auditing performance (Lighthouse-style metrics, flamegraphs)
- Diagnosing layout/rendering issues in a real browser context
- Testing responsive designs across viewport sizes

## When NOT to use

- Server-side debugging (use Node.js debugger or server logs)
- Unit/integration tests (use Vitest/Jest instead)
- Headless CI environments without Xvfb/display server
- When Chrome/Chromium is not installed on the host

## Prerequisites

1. **Chrome or Chromium installed** on the host system
2. **MCP server configured** in `.roo/mcp.json` pointing to `chrome-devtools-mcp` (see [`references/mcp-setup.md`](references/mcp-setup.md))
3. **Dev port available** — default `9222`, configurable via script

## Workflow

### 1. Launch Chrome with Remote Debugging

Run the launch script to start Chrome with `--remote-debugging-port`:

```bash
./.roo/skills/browser-debugging/scripts/chrome-dev.sh \
  --url http://localhost:5173 \
  --port 9222
```

Read [`scripts/chrome-dev.sh`](scripts/chrome-dev.sh) for full CLI options (headless, window size, incognito, etc.).

**Expected output:** Chrome starts in the foreground/background with a message like:
```
Chrome launched with remote debugging on port 9222
DevTools URL: http://localhost:9222
```

### 2. Connect to DevTools MCP

Once Chrome is running, the MCP server at `chrome-devtools-mcp` connects to `localhost:9222`. Use the following MCP tools:

| Tool | Purpose | Read |
|------|---------|------|
| `browser_navigate` | Open a URL in the connected browser | [`references/mcp-tools.md#navigation`](references/mcp-tools.md) |
| `browser_screenshot` | Capture full-page or viewport screenshot | [`references/mcp-tools.md#screenshots`](references/mcp-tools.md) |
| `browser_console_messages` | Retrieve console.log/warn/error output | [`references/mcp-tools.md#console`](references/mcp-tools.md) |
| `browser_network_requests` | List all network requests with status | [`references/mcp-tools.md#network`](references/mcp-tools.md) |
| `browser_evaluate` | Execute JavaScript in the page context | [`references/mcp-tools.md#evaluate`](references/mcp-tools.md) |
| `browser_click` / `browser_fill` | Interact with page elements | [`references/mcp-tools.md#interaction`](references/mcp-tools.md) |

### 3. Debug the Issue

Follow the appropriate debugging path:

**DOM/CSS issues:**
1. Use `browser_evaluate` to inspect element properties
2. Use `browser_screenshot` to capture visual state
3. Read [`references/debugging-dom.md`](references/debugging-dom.md) for common patterns

**Network issues:**
1. Use `browser_network_requests` to list requests
2. Filter by status code, resource type, or URL pattern
3. Read [`references/debugging-network.md`](references/debugging-network.md) for troubleshooting flows

**JavaScript errors:**
1. Use `browser_console_messages` to capture logs
2. Use `browser_evaluate` to step through problematic code
3. Read [`references/debugging-js-errors.md`](references/debugging-js-errors.md)

### 4. Capture Evidence

Before closing, capture debug evidence:

```bash
# Screenshot
browser_screenshot { path: "debug-evidence.png" }

# Console logs
browser_console_messages { levels: ["error", "warn"] }

# Network summary
browser_network_requests { byStatus: true }
```

### 5. Close Chrome

When done, close the browser gracefully:

```bash
# The script provides a cleanup command
./.roo/skills/browser-debugging/scripts/chrome-dev.sh --close
```

## Files

| File | Purpose |
|------|---------|
| [`scripts/chrome-dev.sh`](scripts/chrome-dev.sh) | Launch/close Chrome with remote debugging |
| [`references/mcp-setup.md`](references/mcp-setup.md) | MCP server configuration guide |
| [`references/mcp-tools.md`](references/mcp-tools.md) | Complete Chrome DevTools MCP tool reference |
| [`references/debugging-dom.md`](references/debugging-dom.md) | DOM/CSS debugging patterns |
| [`references/debugging-network.md`](references/debugging-network.md) | Network request troubleshooting |
| [`references/debugging-js-errors.md`](references/debugging-js-errors.md) | JavaScript error diagnosis |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 9222 already in use | Use `--port <new-port>` flag; kill existing process with `lsof -ti:9222 \| xargs kill` |
| MCP connection refused | Verify Chrome launched successfully; check `http://localhost:9222/json/version` returns JSON |
| Screenshot fails | Ensure browser window is not minimized; try `--no-sandbox` flag on Linux headless |
| Page navigation timeout | Check dev server is running (`npm run dev`); verify URL matches your Vite config |
