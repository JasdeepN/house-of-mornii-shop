#!/usr/bin/env bash
# Launch Chrome/Chromium with remote debugging enabled for MCP connection.
# Usage: chrome-dev.sh [OPTIONS]
#
# Options:
#   --url URL         Page to open (default: about:blank)
#   --port PORT       DevTools port (default: 9222)
#   --headless        Run in headless mode
#   --new-window      Open in new window (foreground)
#   --incognito       Use incognito mode
#   --width W         Window width (default: 1440)
#   --height H        Window height (default: 900)
#   --close           Close any Chrome instance on PORT and exit
#   --status          Check if Chrome is running on PORT
#   --help            Show this help message

set -euo pipefail

# --- Defaults ---
URL="about:blank"
PORT=9222
HEADLESS=false
NEW_WINDOW=false
INCOGNITO=false
WIDTH=1440
HEIGHT=900

# --- Parse arguments ---
while [[ $# -gt 0 ]]; do
  case "$1" in
    --url)       URL="$2"; shift 2 ;;
    --port)      PORT="$2"; shift 2 ;;
    --headless)  HEADLESS=true; shift ;;
    --new-window) NEW_WINDOW=true; shift ;;
    --incognito) INCOGNITO=true; shift ;;
    --width)     WIDTH="$2"; shift 2 ;;
    --height)    HEIGHT="$2"; shift 2 ;;
    --close)
      PID=$(lsof -ti:"$PORT" 2>/dev/null || true)
      if [[ -n "$PID" ]]; then
        echo "Closing Chrome on port $PORT (PID: $PID)..."
        kill "$PID" 2>/dev/null || true
        sleep 1
        kill -9 "$PID" 2>/dev/null || true
        echo "Chrome closed."
      else
        echo "No Chrome instance found on port $PORT."
      fi
      exit 0
      ;;
    --status)
      if lsof -ti:"$PORT" >/dev/null 2>&1; then
        echo "Chrome is running on port $PORT (PID: $(lsof -ti:$PORT))"
        exit 0
      else
        echo "Chrome is NOT running on port $PORT"
        exit 1
      fi
      ;;
    --help)
      head -25 "$0" | grep '^#' | sed 's/^# \?//'
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

# --- Find Chrome binary ---
CHROME_BIN=""

# Priority 1: System Chrome/Chromium
for candidate in google-chrome-stable google-chrome chromium-browser chromium chrome; do
  if command -v "$candidate" &>/dev/null; then
    CHROME_BIN="$candidate"
    break
  fi
done

# Priority 2: Playwright bundled Chromium (fallback)
if [[ -z "$CHROME_BIN" ]]; then
  # Find Playwright Chromium via glob expansion (works in for-loop but not [[ -f ]])
  PW_DIR=""
  for d in "$HOME"/.cache/ms-playwright/chromium-*/chrome-linux64/; do
    if [[ -f "$d/chrome" ]]; then
      PW_DIR="$d"
      break
    fi
  done
  
  if [[ -n "$PW_DIR" ]]; then
    CHROME_BIN="${PW_DIR}chrome"
    echo "Using Playwright Chromium: $CHROME_BIN"
  fi
fi

# Priority 3: NODE_PATH for project-local playwright (optional)
if [[ -z "$CHROME_BIN" && -n "${NODE_PATH:-}" ]]; then
  PW_ROOT="$(dirname "$(find "$NODE_PATH" -name "playwright-core" -type d 2>/dev/null | head -1)")"
  if [[ -f "$PW_ROOT/.cache/ms-playwright/chromium-*/chrome-linux64/chrome" ]]; then
    CHROME_BIN="$PW_ROOT/.cache/ms-playwright/chromium-*/chrome-linux64/chrome"
  fi
fi

if [[ -z "$CHROME_BIN" ]]; then
  echo "ERROR: Chrome/Chromium not found. Install one of:" >&2
  echo "  google-chrome-stable, google-chrome, chromium-browser, chromium" >&2
  exit 1
fi

# --- Build flags ---
FLAGS=(
  "--remote-debugging-port=$PORT"
  "--no-first-run"
  "--no-default-browser-check"
  "--window-size=$WIDTH,$HEIGHT"
)

if [[ "$HEADLESS" == "true" ]]; then
  FLAGS+=("--headless=new")
fi

if [[ "$INCOGNITO" == "true" ]]; then
  FLAGS+=("--incognito")
fi

# --- Launch ---
echo "Launching $CHROME_BIN with remote debugging on port $PORT..."
echo "DevTools URL: http://localhost:$PORT"
echo "Page URL: $URL"

if [[ "$NEW_WINDOW" == "true" ]]; then
  # Foreground mode — keep terminal attached
  exec "$CHROME_BIN" "${FLAGS[@]}" "$URL"
else
  # Background mode — detach from terminal
  nohup "$CHROME_BIN" "${FLAGS[@]}" "$URL" >/dev/null 2>&1 &
  CHROME_PID=$!
  echo "Chrome started with PID $CHROME_PID (background)."
  echo "To close: $0 --port $PORT --close"
fi
