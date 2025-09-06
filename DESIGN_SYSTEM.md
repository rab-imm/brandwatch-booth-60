# BrandIQ Design System

This project uses a robust, remixable design system built for consistency and flexibility across all components.

## Icon System

### Usage
```tsx
import { Icon } from "@/components/ui/Icon"

// Basic usage
<Icon name="trending-up" size={24} />

// With styling
<Icon name="users" className="text-brand-primary" weight="bold" />

// Type-safe icon names with intellisense
<Icon name="chart-line" color="#3b82f6" />
```

### Available Icons
All icons are organized in categories and available through a unified registry:

- **Analytics**: `chart-line`, `chart-bar`, `chart-pie`, `analytics`, `dashboard`, `trending-up`
- **Business**: `eye`, `target`, `users`, `brain`, `lightning`, `shield`, `rocket`, `globe`
- **UI Actions**: `check`, `info`, `warning`, `close`, `menu`, `search`, `settings`, `user`
- **Navigation**: `chevron-down`, `chevron-up`, `chevron-left`, `chevron-right`, `arrow-right`
- **Social**: `brand-google`, `brand-twitter`, `brand-linkedin`, `brand-facebook`
- **Data**: `database`, `cloud`, `device-analytics`, `filter`, `sort`

### ESLint Rule
Direct `lucide-react` imports are forbidden. Always use the `Icon` component for consistency.

## Color System

### Semantic Colors
All colors use HSL values and semantic CSS variables:

```css
/* Brand colors */
--brand-primary: 225 15% 15%;    /* Deep slate */
--brand-secondary: 220 15% 92%;  /* Light porcelain */
--brand-accent: 230 35% 45%;     /* Rich slate blue */

/* Surface colors */
--background: 220 20% 98%;       /* Cool porcelain white */
--card: 0 0% 100%;               /* Pure white cards */
--popover: 0 0% 100%;            /* Overlay backgrounds */
```

### Usage in Components
```tsx
// ✅ Correct - Use semantic tokens
<div className="bg-brand-primary text-brand-secondary">

// ❌ Wrong - Don't use direct colors
<div className="bg-slate-900 text-white">
```

### Design Tokens
Import design tokens for programmatic access:

```tsx
import { designTokens } from "@/components/ui/design-tokens"

const primaryColor = designTokens.colors.brand.primary
const cardShadow = designTokens.shadows.card
```

## Component Guidelines

### Button Variants
- `default`: Primary brand actions
- `outline`: Secondary actions with backdrop blur
- `premium`: High-value features with gradients
- `pastel-*`: Themed variants using pastel colors

### Cards & Surfaces
All cards use the surface elevation system:
- `bg-surface` - Default background
- `bg-surface-elevated` - Card backgrounds  
- `bg-surface-overlay` - Modal/popover backgrounds
- `bg-surface-glass` - Semi-transparent overlays

### Shadows
- `shadow-soft` - Subtle shadows
- `shadow-card` - Standard card elevation
- `shadow-elevated` - Hover/focus states
- `shadow-overlay` - Modal/dropdown shadows

## Typography

### Fonts
- **Display**: `font-pact-display` - Plus Jakarta Sans for headings
- **Body**: `font-pact-body` - Inter for body text

### Usage
```tsx
<h1 className="text-4xl font-pact-display tracking-tight">
<p className="text-base font-pact-body">
```

## Responsive Design

### Container System
- `container mx-auto` - Centered content container
- `max-w-7xl` - Maximum content width
- `px-6` - Consistent horizontal padding

### Grid System
- Mobile-first approach
- `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Use `gap-6` for consistent spacing

## IconBadge Component System

### Usage Protocol
**CRITICAL**: Never use gradient circles for icons as they create visibility issues. Always use flat fills with proper contrast.

```tsx
import { IconBadge } from "@/components/ui/IconBadge"

// ✅ CORRECT - Flat background with proper contrast
<IconBadge icon="chart-line" tone="sage" size="md" />

// ❌ WRONG - Gradient circles cause icon visibility issues
<div className="bg-gradient-to-br from-pastel-sage to-pastel-mint">
  <Icon name="chart-line" className="text-white" />
</div>
```

### Available Props
- **icon**: Icon name from the registry (string)
- **tone**: `sage` | `peach` | `lavender` | `sky` | `sand` | `primary` | `secondary` | `accent` | `brand`
- **size**: `sm` (32px) | `md` (48px) | `lg` (64px) | `xl` (80px)
- **shape**: `circle` | `square` 
- **elevated**: `true` | `false` (adds hover shadow effects)

### Design Principles
1. **Flat Backgrounds**: Always use solid colors, never gradients for icon containers
2. **Proper Contrast**: All tone variants have corresponding foreground colors for accessibility
3. **Consistent Sizing**: Use the size prop rather than custom dimensions
4. **Semantic Usage**: Use appropriate tones that match the icon's context

### Accessibility
- All combinations meet WCAG AA contrast requirements
- Icons are properly sized for touch targets
- Semantic HTML structure supports screen readers

### ESLint Integration
Our design system includes an ESLint rule that prevents direct `lucide-react` imports:

```javascript
// eslint.config.js
"no-restricted-imports": ["error", {
  "paths": [{
    "name": "lucide-react", 
    "message": "Use Icon component from @/components/ui/Icon instead of direct lucide-react imports"
  }]
}]
```

This ensures all icons go through our unified system for consistency and performance.

### File Organization
- Keep components focused and small
- Use parallel tool calls for efficiency
- Prefer composition over large monolithic files

### Styling Rules
1. Always use semantic color tokens
2. Use the Icon component instead of direct lucide-react imports
3. Leverage the design system for consistency
4. Use backdrop-blur for glass effects
5. Implement proper contrast ratios

### Performance
- Icons are tree-shakable through the registry
- CSS variables allow runtime theming
- Semantic tokens enable consistent design scaling

## Remixing This Project

When remixing this project for your own use:

1. **Update Brand Colors**: Modify the HSL values in `index.css`
2. **Customize Icon Registry**: Add/remove icons in `icons.registry.ts`
3. **Extend Design Tokens**: Add new tokens in `design-tokens.ts`
4. **Configure Fonts**: Update font imports in `tailwind.config.ts`

The entire system is built to be easily customizable while maintaining consistency and type safety.