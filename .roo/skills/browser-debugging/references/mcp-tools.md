# Chrome DevTools MCP Tool Reference

## Navigation

### `browser_navigate`

Open a URL in the connected browser.

```json
{
  "url": "http://localhost:5173"
}
```

**Parameters:**
- `url` (required): Full URL to navigate to
- `waitUntil` (optional): Navigation wait condition — `load`, `domcontentloaded`, `networkidle0`, `networkidle2` (default: `load`)

### `browser_go_back`

Navigate back in browser history.

### `browser_go_forward`

Navigate forward in browser history.

### `browser_reload`

Reload the current page.

## Screenshots

### `browser_screenshot`

Capture a screenshot of the current page.

```json
{
  "path": "debug-screenshot.png",
  "fullPage": false
}
```

**Parameters:**
- `path` (optional): File path to save screenshot (PNG). If omitted, returns base64.
- `fullPage` (optional): Capture entire scrollable page (default: `false`)
- `clip` (optional): `{ x, y, width, height }` for viewport-only capture

## Console

### `browser_console_messages`

Retrieve console messages from the page.

```json
{
  "levels": ["log", "warn", "error"],
  "includeExceptions": true
}
```

**Parameters:**
- `levels` (optional): Filter by level — `log`, `debug`, `info`, `warn`, `error` (default: all)
- `includeExceptions` (optional): Include uncaught exceptions (default: `true`)

**Response format:**
```json
[
  {
    "timestamp": 1234567890,
    "level": "error",
    "text": "Uncaught TypeError: ...",
    "url": "http://localhost:5173/app.js",
    "lineNumber": 42
  }
]
```

## Network

### `browser_network_requests`

List all network requests.

```json
{
  "byStatus": false,
  "resourceType": "xhr"
}
```

**Parameters:**
- `byStatus` (optional): Group results by HTTP status code (default: `false`)
- `resourceType` (optional): Filter by type — `document`, `stylesheet`, `script`, `xhr`, `fetch`, `image`, `font`, `websocket`, `manifest`
- `urlPattern` (optional): Regex to filter URLs

**Response format:**
```json
[
  {
    "url": "http://localhost:5173/api/products",
    "method": "GET",
    "status": 200,
    "type": "xhr",
    "duration": 145,
    "size": 2048
  }
]
```

## Evaluation

### `browser_evaluate`

Execute JavaScript in the page context.

```json
{
  "expression": "document.title"
}
```

**Parameters:**
- `expression` (required): JavaScript expression or statement to evaluate
- `returnByValue` (optional): Return serialized result instead of handle (default: `false`)

**Example — get computed styles:**
```json
{
  "expression": "getComputedStyle(document.querySelector('.product-card')).display"
}
```

## Interaction

### `browser_click`

Click an element by CSS selector.

```json
{
  "selector": ".add-to-cart-btn"
}
```

### `browser_fill`

Fill an input field.

```json
{
  "selector": "#search-input",
  "value": "necklace"
}
```

### `browser_select`

Select an option from a `<select>`.

```json
{
  "selector": "#size-select",
  "value": "medium"
}
```

### `browser_press_key`

Press a keyboard key.

```json
{
  "key": "Escape"
}
```

## DOM Inspection

### `browser_get_attributes`

Get attributes of an element.

```json
{
  "selector": ".product-card",
  "names": ["class", "data-product-id", "aria-label"]
}
```

### `browser_get_text`

Get text content of an element.

```json
{
  "selector": ".product-title"
}
```

### `browser_hover`

Hover over an element (triggers :hover states).

```json
{
  "selector": ".nav-dropdown-trigger"
}
```
