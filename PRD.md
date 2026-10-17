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

> **Note:** The peacock imagery and jewel-tone wording below is the original concept. The current look is the champagne and teal palette in Color Selection, with a teal header and footer and layout C Product cards.

The design should evoke the feeling of stepping into an exclusive jewelry atelier where heritage meets modern luxury. Rich jewel tones (deep teals, lustrous golds), ornate Victorian-inspired borders, and peacock feather motifs create a sense of regal opulence. Typography should be elegant and refined, with script fonts for brand elements and sophisticated serifs for body content. Every interaction should feel precious and intentional, like handling fine jewelry.

## Color Selection

A champagne and teal palette, light only (v1.0 has no dark mode). Defined once in `src/tailwind.css`. Gold is decoration, never text:

- **Page**: Champagne `oklch(0.924 0.027 78.2)` background; Ink `oklch(0.335 0.045 193.0)` text
- **Primary/Accent**: Deep Teal `oklch(0.336 0.054 200.5)` (#063F42) for buttons, links and the header and footer; hover `oklch(0.409 0.061 199.7)`
- **Card**: `oklch(0.941 0.020 74.7)`; Muted `oklch(0.894 0.032 78.1)`; Border `oklch(0.846 0.027 80.2)`
- **Gold**: `oklch(0.649 0.077 83.8)` for rules and ornaments; Gold on teal `oklch(0.800 0.100 76)` for accents inside the teal bars
- **Foreground/Background Pairings** (measured):
  - Page `oklch(0.924 0.027 78.2)`: Ink text `oklch(0.335 0.045 193.0)` - Ratio 9.4:1 ✓
  - Page: Muted text `oklch(0.502 0.020 145.3)` - Ratio 4.7:1 ✓
  - Teal `oklch(0.336 0.054 200.5)`: Champagne text `oklch(0.941 0.020 74.7)` - Ratio 9.8:1 ✓
  - Teal: Gold on teal `oklch(0.800 0.100 76)` - Ratio 6.2:1 ✓
  - Page: Gold `oklch(0.649 0.077 83.8)` - Ratio 2.6:1 (decoration only, never text)

## Font Selection

- **Heading Font**: Noto Serif Display, self-hosted as "Mornii Display" at weight 400 (`font-heading`)
- **Body Font**: Arial (`font-body`)
- **Script Font**: Great Vibes (script) - only for the "Mornii" brand element (`font-script`)

Cinzel, Cormorant Garamond and Inter are no longer used.

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
  - **NEW**: Support for high-resolution baroque border image with realistic metallic gold and teal accents
  - OrnamentalBorder component now accepts both SVG and image-based borders via `useImageBorder` prop
  - Multiple ornamental assets (corner-flourish.svg, divider-ornament.svg, header-ornament.svg)
  - Baroque border PNG asset (baroque-border.png) with intricate rococo styling and peacock motifs
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
