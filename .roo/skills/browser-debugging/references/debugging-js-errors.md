# JavaScript Error Diagnosis

## Capturing Errors

### Get all console errors

```json
{
  "levels": ["error"],
  "includeExceptions": true
}
```

### Get warnings too

```json
{
  "levels": ["warn", "error"],
  "includeExceptions": true
}
```

## Common Error Patterns

### `TypeError: Cannot read properties of undefined`

**Cause:** Accessing a property on `null` or `undefined`.

**Debug steps:**
1. Find the error in `browser_console_messages` — note the URL and line number
2. Use `browser_evaluate` to check the variable at that scope
3. Check if data is loaded (async timing issue?)

### `ReferenceError: x is not defined`

**Cause:** Using an undeclared variable.

**Debug steps:**
1. Verify the script/module is loaded (`browser_network_requests` for `script` type)
2. Check import/export paths
3. Verify module bundler configuration

### `SyntaxError: Unexpected token`

**Cause:** Invalid JavaScript syntax in source or response.

**Debug steps:**
1. Check the file URL from console message
2. Verify the source compiles (`npm run build`)
3. Check for corrupted CDN responses

### Promise rejections (unhandled)

**Symptoms:** Console shows `Uncaught (in promise)` without stack trace.

**Enable tracking:**
```json
{
  "expression": "window.addEventListener('unhandledrejection', e => console.error('Unhandled:', e.reason))"
}
```

## Error Stack Trace Analysis

Console error format:
```
Error: Something went wrong
    at myFunction (app.js:42:15)
    at handleClick (app.js:100:8)
```

**Reading the stack:**
- Bottom line = entry point (e.g., event handler)
- Top line = actual failure location
- Focus debugging on lines near the top

## Debugging Flow

```
1. browser_console_messages (levels: ["error"], includeExceptions: true)
   → Get all errors with stack traces

2. Identify error pattern (TypeError, ReferenceError, SyntaxError, etc.)

3. Use browser_evaluate to inspect variables at failure point

4. browser_screenshot to capture page state

5. Check browser_network_requests for related failed API calls
```

## Prevention Checklist

- [ ] All async operations have `.catch()` or `try/catch`
- [ ] Optional chaining (`?.`) used for potentially null values
- [ ] Environment variables validated at startup
- [ ] Error boundaries in place for React components
- [ ] Console warnings enabled in dev: `console.warn()` for deprecated patterns
