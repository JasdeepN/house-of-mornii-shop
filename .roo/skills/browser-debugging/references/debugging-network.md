# Network Request Troubleshooting

## Diagnosing Failed Requests

### Step 1: List all requests

```json
{
  "byStatus": true
}
```

Look for non-2xx status codes.

### Step 2: Filter by resource type

```json
{
  "resourceType": "xhr"
}
```

Common types to check:
- `xhr` / `fetch`: API calls
- `document`: HTML pages
- `script`: JavaScript bundles
- `stylesheet`: CSS files
- `font`: Web fonts

### Step 3: Inspect specific request

Use `urlPattern` to filter:
```json
{
  "urlPattern": "/api/shopify"
}
```

## Common Issues

### CORS errors

**Symptoms:** Console shows `Access-Control-Allow-Origin` errors.

**Checklist:**
1. Verify the origin in `browser_console_messages` matches your allowed origins
2. Check server-side CORS headers on the API endpoint
3. For Shopify: ensure store domain is correctly configured

### 401/403 errors

**Symptoms:** Authentication failures.

**Checklist:**
1. Check if auth tokens are present in request headers
2. Verify token expiration
3. Check `browser_console_messages` for auth-related errors

### 500/502/503 errors

**Symptoms:** Server-side failures.

**Checklist:**
1. Check request payload in `browser_network_requests` (inspect `size` field)
2. Verify server health endpoint
3. Check server logs for stack traces

### Slow requests

**Symptoms:** High `duration` in network response.

**Checklist:**
1. Identify bottleneck: DNS, TCP, TTFB, or content download
2. Check if caching headers are set correctly
3. Verify CDN configuration

## Debugging Flow

```
1. browser_network_requests (byStatus: true)
   → Find failed requests (non-2xx)

2. browser_console_messages (levels: ["error"])
   → Find related error messages

3. browser_evaluate (expression: "performance.getEntriesByType('resource')")
   → Get detailed timing breakdown

4. browser_screenshot
   → Capture visual state at time of failure
```
