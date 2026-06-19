# Animation Guidelines

## Duration Standards

| Element Type | Max Duration | Easing |
|--------------|-------------|--------|
| Hover effects | 200ms | `luxuryEase` [0.16, 1, 0.3, 1] |
| Focus transitions | 150ms | `luxuryEase` [0.16, 1, 0.3, 1] |
| Component entrance | 300ms | `luxuryEase` [0.16, 1, 0.3, 1] |
| Page transitions | 400ms | `luxuryEase` [0.16, 1, 0.3, 1] |
| Loading spinners | Continuous | Linear |

## Easing Functions

**Primary easing:** `cubic-bezier(0.16, 1, 0.3, 1)` — defined as `luxuryEase` in animations

```ts
// src/lib/animations.ts
export const luxuryEase = [0.16, 1, 0.3, 1] as const;
```

**Rule:** All framer-motion components must use `transition={{ ease: luxuryEase, duration: <value> }}`.

## Animation Properties

| Property | Allowed Values |
|----------|---------------|
| `opacity` | 0 → 1, 1 → 0 |
| `y` | -20 → 0, 0 → 20 (entrance/exit) |
| `scale` | 0.95 → 1 (hover) |
| `rotate` | Only for spinners |

## Audit Steps

1. Search all `.tsx` files for `framer-motion` imports and `transition` props
2. Verify duration values are within the standards above
3. Check that easing uses `luxuryEase` — flag any custom cubic-bezier values
4. Ensure no component has animations longer than 400ms (except page transitions)
