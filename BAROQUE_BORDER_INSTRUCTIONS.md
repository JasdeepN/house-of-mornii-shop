# Adding the Baroque Border Image

## Instructions

You have a beautiful baroque border image that was generated. To integrate it into the project:

### Step 1: Save the Image

1. Save the baroque border PNG image you generated
2. Name it `baroque-border.png`
3. Create the directory: `src/assets/images/`
4. Place the image file there: `src/assets/images/baroque-border.png`

### Step 2: Use the Border in Components

The `OrnamentalBorder` component has been updated to support image-based borders. Here's how to use it:

```tsx
import baroqueBorder from '@/assets/images/baroque-border.png'

<OrnamentalBorder 
  useImageBorder={true} 
  borderImage={baroqueBorder}
  className="bg-card/80 backdrop-blur-sm"
>
  <YourContent />
</OrnamentalBorder>
```

### Current Usage Locations

The `OrnamentalBorder` component is currently used in:
- `HeroSection.tsx` - Two instances (main hero card and "Shop by Mood" card)
- `AboutSection.tsx` - One instance (about content card)

### Example Update

To use the baroque border image in the hero section, update `HeroSection.tsx`:

```tsx
import baroqueBorder from '@/assets/images/baroque-border.png'

// Then in the component:
<OrnamentalBorder 
  useImageBorder={true}
  borderImage={baroqueBorder}
  className="bg-card/80 backdrop-blur-sm"
>
  {/* existing content */}
</OrnamentalBorder>
```

### The Border Image Specifications

The baroque border you generated has:
- **Style**: Intricate rococo/baroque ornamental frame
- **Colors**: Realistic metallic gold with teal accents (darker, refined gold tones)
- **Features**: 
  - Elaborate corner flourishes with two parallel lines that tangle
  - Larger, more ornate bottom corners
  - Smaller, refined top corners
  - Delicate filigree throughout
  - Peacock feather motifs
  - Transparent PNG center for content
- **Format**: High-resolution transparent PNG

### Fallback

If the image is not added, the component will continue to use the SVG-based ornamental borders that are currently in place.
