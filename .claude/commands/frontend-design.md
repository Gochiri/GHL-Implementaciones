# Frontend Design Skill

You are an expert frontend designer and developer. Follow these principles and best practices when working on UI/UX tasks.

## Design Principles

### Visual Hierarchy
- Use size, color, and spacing to establish importance
- Primary actions should be visually prominent
- Group related elements together
- Use whitespace effectively to reduce cognitive load

### Consistency
- Maintain consistent spacing (use a spacing scale: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px)
- Use a limited color palette (primary, secondary, accent, neutrals, semantic colors)
- Keep typography consistent (2-3 font sizes for body, headings hierarchy)
- Reuse component patterns throughout the application

### Accessibility (WCAG 2.1)
- Minimum contrast ratio: 4.5:1 for normal text, 3:1 for large text
- All interactive elements must be keyboard accessible
- Use semantic HTML elements (`<button>`, `<nav>`, `<main>`, `<article>`)
- Include ARIA labels where needed
- Ensure focus states are visible
- Support reduced motion preferences

### Responsive Design
- Mobile-first approach
- Breakpoints: 640px (sm), 768px (md), 1024px (lg), 1280px (xl), 1536px (2xl)
- Use relative units (rem, em, %) over fixed pixels
- Flexible grids and images
- Touch targets minimum 44x44px on mobile

## Component Best Practices

### Buttons
- Background: primary color
- Padding: 12px 24px
- Border-radius: 6-8px
- Font-weight: 500-600
- Hover: darken 10% or add shadow
- Active: darken 15%
- Disabled: 50% opacity, no pointer events

### Forms
- Labels above inputs (not placeholders as labels)
- Clear error states with red border + error message below
- Success states with green indicators
- Input padding: 12px 16px
- Consistent border-radius across all inputs
- Focus ring: 2px offset, primary color

### Cards
- Consistent padding (16px-24px)
- Subtle shadow for elevation
- Border-radius: 8px-12px
- Clear content hierarchy within

### Navigation
- Sticky/fixed header for main navigation
- Clear active state indication
- Mobile: hamburger menu or bottom navigation
- Breadcrumbs for deep hierarchies

## Color Guidelines

### Semantic Colors
- **Success**: Green (#10B981, #22C55E)
- **Warning**: Yellow/Amber (#F59E0B, #FBBF24)
- **Error**: Red (#EF4444, #DC2626)
- **Info**: Blue (#3B82F6, #0EA5E9)

### Neutral Palette
- Use a gray scale with 9-10 steps
- Background: lightest grays (#F9FAFB, #F3F4F6)
- Text: darkest grays (#111827, #1F2937)
- Borders: mid grays (#E5E7EB, #D1D5DB)

## Typography

### Scale (using 1.25 ratio)
- xs: 12px, sm: 14px, base: 16px, lg: 18px
- xl: 20px, 2xl: 24px, 3xl: 30px, 4xl: 36px

### Line Heights
- Headings: 1.2-1.3
- Body text: 1.5-1.6
- UI elements: 1.4

## Animation & Transitions

### Timing
- Micro-interactions: 150-200ms
- Page transitions: 300-400ms
- Complex animations: 400-600ms

### Easing
- Default: ease-out or cubic-bezier(0.4, 0, 0.2, 1)
- Enter: ease-out / Exit: ease-in / Movement: ease-in-out

### What to Animate
- Opacity, transform (scale, translate, rotate), background/border color, box shadow
- Avoid: width, height, top, left (use transform instead)

## Layout Patterns

### Common Layouts
1. **Dashboard**: Sidebar + main content area
2. **Marketing**: Full-width sections, hero at top
3. **Documentation**: Sidebar nav + content + table of contents
4. **E-commerce**: Grid of cards with filters sidebar
5. **Settings**: Vertical tabs or stacked sections

### Spacing System
- Component internal padding: 16px-24px
- Between related elements: 8px-12px
- Between sections: 32px-48px
- Page margins: 16px (mobile), 24px-32px (tablet), 48px+ (desktop)

## Tailwind CSS (Preferred Framework)
- Utility-first approach
- Consistent design tokens built-in
- Responsive prefixes (sm:, md:, lg:)
- Dark mode support (dark:)

## Dark Mode
- Use CSS variables for colors
- Semantic color naming (--color-background, --color-text-primary)
- Test contrast in both modes
- Respect system preference with `prefers-color-scheme`

---

Apply these principles to any frontend task. Prioritize accessibility, consistency, and user experience.
