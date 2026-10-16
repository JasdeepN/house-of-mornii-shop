# DOM/CSS Debugging Patterns

## Inspecting Element State

### Get computed styles

```json
{
  "expression": "JSON.stringify(getComputedStyle(document.querySelector('.my-element')), null, 2)"
}
```

### Check if element is visible

```json
{
  "expression": "(el) => { const r = el.getBoundingClientRect(); return { width: r.width, height: r.height, visible: r.width > 0 && r.height > 0 }; }(document.querySelector('.my-element'))"
}
```

### List all CSS classes

```json
{
  "expression": "document.querySelector('.my-element').className"
}
```

## Common Issues

### Element not rendering

1. Check visibility: `browser_evaluate` with `getBoundingClientRect()`
2. Check z-index stacking: inspect computed `z-index` and `position`
3. Check overflow: verify parent containers don't clip content
4. Check display/visibility: `display: none`, `visibility: hidden`

### Layout shifts

1. Capture screenshot before/after interaction
2. Check for dynamic content injection (ads, modals)
3. Verify font loading doesn't cause reflow (`font-display: swap`)
4. Inspect flexbox/grid container constraints

### Responsive issues

1. Use `browser_evaluate` to check viewport: `window.innerWidth / window.innerHeight`
2. Test media query breakpoints with DevTools device mode
3. Verify responsive images load correctly

## Debugging Checklist

- [ ] Element exists in DOM (`document.querySelector` returns non-null)
- [ ] Element is visible (not `display: none`, `visibility: hidden`, or zero dimensions)
- [ ] Correct CSS classes applied (check for specificity conflicts)
- [ ] No parent container clipping content (overflow, z-index)
- [ ] Responsive breakpoints render correctly
- [ ] Screenshot matches expected layout
