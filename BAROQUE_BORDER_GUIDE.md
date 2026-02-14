# 🎨 Baroque Border Integration Guide

## Overview

Your beautiful baroque border image with intricate gold and teal ornamentation is ready to be integrated into the House of Mornii site! This guide walks you through the complete integration process.

## 📋 What You Have

1. ✅ **Generated Border Image** - The ornate baroque/rococo border with:
   - Realistic metallic gold with depth (darker, refined tones)
   - Teal accents from peacock theme
   - Elaborate corner flourishes (larger at bottom, refined at top)
   - Parallel border lines that elegantly tangle
   - Transparent PNG center for content
   - High resolution (2048px+)

2. ✅ **Updated Components** - The codebase has been enhanced:
   - `OrnamentalBorder.tsx` now supports both SVG and image borders
   - `BaroqueBorderShowcase.tsx` provides visual instructions
   - `BorderToggle.tsx` allows easy switching between border types
   - Example files showing exact usage

## 🚀 Quick Start (3 Steps)

### Step 1: Add Your Image

1. Create the images directory:
   ```bash
   mkdir -p /workspaces/spark-template/src/assets/images/
   ```

2. Save your generated baroque border image as:
   ```
   /workspaces/spark-template/src/assets/images/baroque-border.png
   ```

### Step 2: Update Components to Use the Border

In any component using `OrnamentalBorder`, add the import and props:

```tsx
// Add this import at the top
import baroqueBorder from '@/assets/images/baroque-border.png'

// Update the OrnamentalBorder usage
<OrnamentalBorder 
  useImageBorder={true} 
  borderImage={baroqueBorder}
  className="bg-card/80 backdrop-blur-sm"
>
  {/* Your content */}
</OrnamentalBorder>
```

### Step 3: Test and Refine

The border image will frame your content. You may need to adjust padding in specific components:

```tsx
<OrnamentalBorder 
  useImageBorder={true} 
  borderImage={baroqueBorder}
  className="bg-card/80 backdrop-blur-sm"
>
  <div className="p-8 md:p-12 lg:p-16">
    {/* Adjust padding as needed for your border's ornate corners */}
  </div>
</OrnamentalBorder>
```

## 📍 Where to Apply the Border

### Current Usage Locations

The `OrnamentalBorder` component is currently used in:

1. **HeroSection.tsx** (2 instances)
   - Main brand card with tagline and CTAs
   - "Shop by Mood" navigation card

2. **AboutSection.tsx** (1 instance)
   - Brand story content card

### Recommended Updates

#### HeroSection.tsx
```tsx
import baroqueBorder from '@/assets/images/baroque-border.png'

// In the hero card:
<OrnamentalBorder 
  useImageBorder={true}
  borderImage={baroqueBorder}
  className="bg-card/80 backdrop-blur-sm"
>
  {/* Brand identity content */}
</OrnamentalBorder>

// In the mood selector card:
<OrnamentalBorder 
  useImageBorder={true}
  borderImage={baroqueBorder}
  className="bg-card/60 backdrop-blur-sm"
>
  {/* Shop by mood content */}
</OrnamentalBorder>
```

#### AboutSection.tsx
```tsx
import baroqueBorder from '@/assets/images/baroque-border.png'

<OrnamentalBorder 
  useImageBorder={true}
  borderImage={baroqueBorder}
  className="bg-card/80 backdrop-blur-sm"
>
  {/* About content */}
</OrnamentalBorder>
```

## 🎛️ Optional: Add Toggle Control

To easily switch between SVG and image borders during development, add the `BorderToggle` component to your App:

```tsx
import { BorderToggle } from '@/components/BorderToggle'

function App() {
  return (
    <>
      {/* ... other components ... */}
      <BorderToggle />
    </>
  )
}
```

This creates a floating toggle in the top-right that persists your preference.

## 🎨 Customization Tips

### Adjusting Background Opacity

The baroque border works best with semi-transparent backgrounds:

```tsx
className="bg-card/80 backdrop-blur-sm"  // 80% opacity (default)
className="bg-card/60 backdrop-blur-md"  // 60% opacity (lighter)
className="bg-card/95 backdrop-blur-lg"  // 95% opacity (darker)
```

### Fine-Tuning Padding

The ornate corners may need specific padding to prevent content overlap:

```tsx
<OrnamentalBorder useImageBorder={true} borderImage={baroqueBorder}>
  <div className="p-12 md:p-16 lg:p-20">
    {/* More padding for elaborate corner flourishes */}
  </div>
</OrnamentalBorder>
```

### Responsive Considerations

On mobile, you may want to reduce padding:

```tsx
<div className="p-8 md:p-12 lg:p-16 xl:p-20">
  {/* Content scales padding with screen size */}
</div>
```

## 🔧 Troubleshooting

### Border Not Showing
- Verify the image path is correct: `/workspaces/spark-template/src/assets/images/baroque-border.png`
- Check that `useImageBorder={true}` is set
- Ensure `borderImage` prop is passed with the imported image

### Border Looks Stretched
- The border should be landscape rectangular to match typical content cards
- If distorted, ensure the original image has the correct aspect ratio

### Content Overlaps Border
- Increase padding: `className="p-12 md:p-16 lg:p-20"`
- The component default is `p-12 md:p-16` which should work for most borders

### Want to Switch Back to SVG
- Simply remove `useImageBorder` and `borderImage` props
- Or set `useImageBorder={false}`

## 📚 Reference Files

- **Main Component**: `/workspaces/spark-template/src/components/OrnamentalBorder.tsx`
- **Instructions**: `/workspaces/spark-template/BAROQUE_BORDER_INSTRUCTIONS.md`
- **Example Usage**: `/workspaces/spark-template/EXAMPLE_BAROQUE_BORDER_USAGE.tsx`
- **Showcase Component**: `/workspaces/spark-template/src/components/BaroqueBorderShowcase.tsx`
- **Toggle Component**: `/workspaces/spark-template/src/components/BorderToggle.tsx`

## 🎯 Next Steps

1. Save your baroque border PNG to the correct location
2. Update the three component files (HeroSection, AboutSection) with the new props
3. Refresh your app to see the beautiful ornate borders
4. Adjust padding and opacity as needed for perfect visual harmony
5. Consider removing the `BaroqueBorderShowcase` component from App.tsx once integrated

## 💡 Pro Tips

- The baroque border complements the existing gold/teal theme perfectly
- Use it sparingly on key content sections to maintain impact
- The SVG borders can remain as a fallback or for less prominent sections
- Consider using the image border for hero/featured content and SVG borders for secondary content

Enjoy your regally ornate House of Mornii website! 👑✨
