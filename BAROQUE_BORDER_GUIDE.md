# Baroque Border Assets

## Current Implementation

The site currently uses an SVG baroque border (`baroque-border.svg`) for all ornamental frames. This SVG features:
- Intricate corner flourishes with tangled double-line designs
- Realistic metallic gold gradients with multiple shading layers
- Larger bottom corner ornaments and smaller top corner ornaments
- Curved corner details instead of angular shapes

## Using a PNG Border (Optional)

If you have a PNG version of the baroque border that you'd like to use instead:

### Step 1: Prepare Your PNG
- Ensure your PNG has a transparent background
- The border design should be placed around the edges of the image
- Leave the center area transparent so content can show through
- Recommended size: At least 1600x1200px for high-quality rendering

### Step 2: Replace the File
1. Save your PNG as `baroque-border.png` in `/src/assets/ornaments/`
2. Open `/src/components/OrnamentalBorder.tsx`
3. Change the import from:
   ```typescript
   import baroqueBorder from '@/assets/ornaments/baroque-border.svg'
   ```
   to:
   ```typescript
   import baroqueBorder from '@/assets/ornaments/baroque-border.png'
   ```

That's it! The component will automatically use your PNG border.

## Border Design Guidelines

When creating or replacing the border, follow these design principles:

### Corner Hierarchy
- **Top Corners**: Smaller, elegant flourishes (approximately 15-20% of frame height)
- **Bottom Corners**: Larger, more intricate ornaments (approximately 25-35% of frame height)

### Visual Style
- **Curves over Angles**: Use flowing, organic curves instead of sharp angular shapes
- **Tangled Lines**: Double lines that weave and intertwine at corners
- **Metallic Gold**: Use realistic gold tones with highlights and shadows:
  - Dark base: `#6B5742`
  - Mid tones: `#8B7355`, `#A38B5F`, `#C9A961`
  - Highlights: `#D4AF37`, `#F4E7C3`

### Frame Structure
- 2-3 parallel border lines around the perimeter
- Lines should "tangle" or weave together at the corners
- Add decorative elements like small circles, diamonds, or flourishes at intersection points

## Technical Notes

- The component uses `object-fit: fill` to stretch the border to fit any content size
- Border padding is responsive: `p-12 md:p-16 lg:p-20`
- The border is positioned absolutely with `z-index: 0` so content appears above it
- All borders are non-interactive with `pointer-events: none`
