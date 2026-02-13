# Planning Guide

A luxurious digital showcase for House of Mornii, a heritage-inspired jewelry brand that elevates everyday moments, festive evenings, and bridal grandeur through statement costume jewelry with regal opulence.

**Experience Qualities**:
1. **Opulent** - Every element should evoke luxury through rich materials, ornate details, and refined craftsmanship that mirrors the jewelry itself
2. **Sophisticated** - The interface should feel cultured and elegant, speaking to discerning customers who appreciate heritage and artistry
3. **Enchanting** - Create an immersive experience that transports visitors into a world of regal beauty, using peacock imagery and jewel-toned aesthetics

**Complexity Level**: Light Application (multiple features with basic state)
This is a content showcase with collection browsing, mood-based shopping navigation, and contact capabilities. State management focuses on user preferences and shopping interactions.

## Essential Features

### Hero Section with Brand Identity
- **Functionality**: Full-viewport hero displaying the House of Mornii brand with peacock feather imagery and elegant typography
- **Purpose**: Immediately establish the luxurious, heritage-inspired brand identity and captivate visitors
- **Trigger**: Page load
- **Progression**: Fade in peacock imagery → Reveal brand logo with ornate borders → Display tagline "REGAL · RADIANT · MODERN" → Show CTA buttons
- **Success criteria**: Hero loads smoothly with all assets, text is readable over imagery, CTAs are clearly visible

### Navigation Header
- **Functionality**: Persistent navigation bar with Collections, Signature, About, Contact links, plus Shop and Book a Styling buttons
- **Purpose**: Provide clear wayfinding throughout the experience while maintaining elegant design
- **Trigger**: Always visible at top of page
- **Progression**: Hover state reveals accent color → Click navigates to section → Active state shows current location
- **Success criteria**: All navigation links work, hover states are smooth, header remains accessible on scroll

### Mood-Based Shopping Navigator
- **Functionality**: Curated shopping experience organized by occasion (Everyday/Polished, Festive/Glow, Bridal/Heirloom) plus Curated Sets
- **Purpose**: Help customers find pieces matching their needs rather than browsing endless catalogs
- **Trigger**: Visible in hero area
- **Progression**: User sees mood categories → Hovers to see emphasis → Clicks category → Filters to relevant collection
- **Success criteria**: Categories are distinct and appealing, transitions are smooth, filtering works accurately

### Collections Showcase
- **Functionality**: Three primary collections (Everyday, Festive, Bridal) displayed as image cards with ornate frames, featuring AI-generated prompts for creating professional jewelry photography
- **Purpose**: Present the breadth of offerings and allow deeper exploration of each collection, while providing ready-to-use AI image generation prompts
- **Trigger**: Scroll to collections section
- **Progression**: Section comes into view → Cards fade in sequentially → AI generates detailed image prompts using GPT-4 → Prompts are displayed on cards → User can copy prompts for DALL-E/Midjourney → Hover reveals additional details
- **Success criteria**: AI prompts generate successfully, prompts are detailed and style-appropriate, cards have hover states, text is readable and copyable

### About Section
- **Functionality**: Brand story and philosophy presented with elegant typography
- **Purpose**: Connect emotionally with customers by sharing the heritage-inspired mission
- **Trigger**: Scroll to about section or click About navigation
- **Progression**: Text fades in → Ornate dividers appear → Content is readable and engaging
- **Success criteria**: Content is legible, spacing is generous, section feels cohesive

### Contact Section
- **Functionality**: Contact information and call-to-action for boutique visits
- **Purpose**: Provide clear next steps for interested customers
- **Trigger**: Scroll to bottom or click Contact navigation
- **Progression**: Contact details appear → CTA button is prominent → User can initiate contact
- **Success criteria**: Contact information is clear, CTA stands out, section is easy to find

## Edge Case Handling

- **Slow Image Loading**: Display elegant skeleton loaders with ornate borders while images load, maintaining visual hierarchy
- **Missing Images**: Show placeholder with peacock feather pattern if product images fail to load
- **Long Text Content**: Implement text truncation with "read more" expansion for descriptions that exceed space
- **Mobile Navigation**: Collapse header navigation into elegant drawer menu with gold accent
- **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible with visible focus states
- **Screen Readers**: Proper ARIA labels and semantic HTML for accessibility

## Design Direction

The design should evoke the feeling of stepping into an exclusive jewelry atelier where heritage meets modern luxury. Rich jewel tones (deep teals, lustrous golds), ornate Victorian-inspired borders, and peacock feather motifs create a sense of regal opulence. Typography should be elegant and refined, with script fonts for brand elements and sophisticated serifs for body content. Every interaction should feel precious and intentional, like handling fine jewelry.

## Color Selection

A rich, jewel-toned palette inspired by peacock plumage and precious metals, updated to feature darker, more refined gold tones:

- **Primary Color**: Deep Teal `oklch(0.45 0.08 210)` - Evokes peacock feathers and precious gemstones, communicates luxury and sophistication
- **Secondary Colors**: 
  - Refined Antique Gold `oklch(0.60 0.11 78)` - Muted, darker gold representing aged precious metals and heritage opulence
  - Dark Slate `oklch(0.20 0.02 210)` - Deep, moody background that makes jewel tones pop
- **Accent Color**: Antique Gold `oklch(0.60 0.11 78)` - Sophisticated metallic highlight for CTAs and ornamental details, replacing the brighter gold
- **Foreground/Background Pairings**:
  - Background Dark `oklch(0.15 0.02 210)`: Light Gold text `oklch(0.95 0.05 85)` - Ratio 11.2:1 ✓
  - Primary Teal `oklch(0.45 0.08 210)`: White text `oklch(1 0 0)` - Ratio 6.1:1 ✓
  - Accent Gold `oklch(0.60 0.11 78)`: Dark Slate text `oklch(0.12 0.02 210)` - Ratio 7.8:1 ✓
  - Card Background `oklch(0.22 0.03 210)`: Light text `oklch(0.92 0.02 85)` - Ratio 9.8:1 ✓

## Font Selection

Typography should balance ornate elegance with modern readability, evoking both heritage craftsmanship and contemporary luxury:

- **Primary Font**: Cormorant Garamond (serif) - Elegant, high-contrast serif with old-style numerals perfect for luxury branding
- **Accent Font**: Cinzel (serif) - Classical proportions inspired by Roman inscriptions, used for headings and the brand name
- **Script Font**: Great Vibes (script) - Flowing, sophisticated script for the "Mornii" brand element

**Typographic Hierarchy**:
- H1 (Brand Name): Cinzel Bold/48px/tight letter-spacing (0.05em)
- H2 (Section Headers): Cinzel Regular/36px/normal letter-spacing (0.08em)
- H3 (Collection Names): Cinzel Regular/28px/wide letter-spacing (0.12em)
- Body (Descriptions): Cormorant Garamond Regular/18px/relaxed line-height (1.6)
- Script (Brand Accent): Great Vibes Regular/64px/flowing spacing
- Buttons: Cormorant Garamond SemiBold/16px/uppercase with letter-spacing (0.15em)

## Animations

Animations should feel precious and intentional, like the careful unveiling of fine jewelry:

- **Hero Entrance**: Subtle fade-in with gentle upward motion (800ms) for brand elements, staggered for hierarchy
- **Peacock Feathers**: Delicate parallax effect on scroll, creating depth without distraction
- **Card Hovers**: Gentle lift with shadow increase and subtle gold border glow (300ms) to indicate interactivity
- **Navigation**: Smooth underline expansion from center (200ms) on hover, maintaining elegance
- **Section Reveals**: Fade-in with slight upward motion as sections enter viewport (600ms)
- **Button Interactions**: Subtle shine effect on hover, gentle press on active state
- **Ornate Borders**: SVG stroke animation on load, drawing borders like fine penmanship (1200ms)

## Component Selection

- **Components**:
  - Card: Base for collection showcases, customized with ornate SVG borders and teal/gold gradients
  - Button: Primary CTAs styled with gold backgrounds and elegant hover states, Secondary with teal borders
  - Sheet: Mobile navigation drawer with dark background and gold accents
  - Separator: Ornate dividers between sections using custom SVG patterns
  - Badge: Collection tags using gold/teal variants
  - Hover Card: Additional product details on collection card hover
  
- **Customizations**:
  - Custom SVG ornamental borders with intricate corner flourishes for hero and card components
  - Multiple ornamental assets (corner-flourish.svg, divider-ornament.svg, header-ornament.svg)
  - Peacock feather SVG patterns for backgrounds and accents
  - Custom scrollbar styling with darker gold accent
  - Gradient overlays for image cards (teal to transparent)
  - Double-line borders with geometric diamond accents
  - Decorative curves and flourishes inspired by Art Nouveau and heritage designs
  
- **States**:
  - Buttons: Rest (darker gold bg), Hover (slightly brighter gold with subtle glow), Active (pressed with deeper tone), Focus (gold ring)
  - Cards: Rest (elevated shadow with double-line border), Hover (higher elevation, intricate ornamental corner glow), Active (slight scale down)
  - Navigation: Rest (muted gold), Hover (darker antique gold underline), Active (gold text with underline)
  
- **Icon Selection**:
  - Sparkles: Accent for luxury and special collections
  - Crown: Signature or curated collections
  - Calendar: Events and styling appointments
  - User: Profile and personalization
  - ShoppingBag: Cart and shop actions
  - Feather: Peacock theme accent throughout
  
- **Spacing**:
  - Container max-width: 1400px with generous side padding (80px desktop, 24px mobile)
  - Section vertical spacing: 120px desktop, 80px mobile
  - Card gaps: 32px between collection cards
  - Content padding: 40px within ornate border cards
  
- **Mobile**:
  - Header: Collapse navigation to Sheet drawer, brand logo scales down but remains prominent
  - Hero: Stack mood categories vertically, reduce text sizes proportionally
  - Collections: Single column card layout with full-width cards
  - Fonts: Scale down by 20-30% while maintaining hierarchy
  - Spacing: Reduce to 60-70% of desktop values for tighter mobile experience
