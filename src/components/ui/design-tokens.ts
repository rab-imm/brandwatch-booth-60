// Design System Tokens - Centralized configuration for consistent theming
// This file provides type-safe access to design tokens defined in index.css

export const designTokens = {
  colors: {
    // Brand colors
    brand: {
      primary: 'hsl(var(--brand-primary))',
      secondary: 'hsl(var(--brand-secondary))', 
      accent: 'hsl(var(--brand-accent))',
      warm: 'hsl(var(--brand-warm))'
    },
    
    // Semantic colors
    background: 'hsl(var(--background))',
    foreground: 'hsl(var(--foreground))',
    card: 'hsl(var(--card))',
    'card-foreground': 'hsl(var(--card-foreground))',
    primary: 'hsl(var(--primary))',
    'primary-foreground': 'hsl(var(--primary-foreground))',
    secondary: 'hsl(var(--secondary))',
    'secondary-foreground': 'hsl(var(--secondary-foreground))',
    muted: 'hsl(var(--muted))',
    'muted-foreground': 'hsl(var(--muted-foreground))',
    accent: 'hsl(var(--accent))',
    'accent-foreground': 'hsl(var(--accent-foreground))',
    
    // Surface colors for overlays
    popover: 'hsl(var(--popover))',
    'popover-foreground': 'hsl(var(--popover-foreground))',
    
    // Interaction colors
    border: 'hsl(var(--border))',
    input: 'hsl(var(--input))',
    ring: 'hsl(var(--ring))',
    
    // Pastel colors
    pastel: {
      peach: 'hsl(var(--pastel-peach))',
      sage: 'hsl(var(--pastel-sage))',
      lavender: 'hsl(var(--pastel-lavender))',
      sky: 'hsl(var(--pastel-sky))',
      sand: 'hsl(var(--pastel-sand))'
    },
    
    // Pastel foreground colors for proper contrast
    'sage-foreground': 'hsl(var(--sage-foreground))',
    'peach-foreground': 'hsl(var(--peach-foreground))',
    'lavender-foreground': 'hsl(var(--lavender-foreground))',
    'sky-foreground': 'hsl(var(--sky-foreground))',
    'sand-foreground': 'hsl(var(--sand-foreground))',
    
    // Chart colors
    chart: {
      1: 'hsl(var(--chart-1))',
      2: 'hsl(var(--chart-2))',
      3: 'hsl(var(--chart-3))',
      4: 'hsl(var(--chart-4))',
      5: 'hsl(var(--chart-5))',
      6: 'hsl(var(--chart-6))',
      7: 'hsl(var(--chart-7))',
      8: 'hsl(var(--chart-8))',
      9: 'hsl(var(--chart-9))',
      10: 'hsl(var(--chart-10))',
      11: 'hsl(var(--chart-11))',
      12: 'hsl(var(--chart-12))'
    }
  },
  
  gradients: {
    warm: 'var(--gradient-warm)',
    dashboard: 'var(--gradient-dashboard)',
    accent: 'var(--gradient-accent)'
  },
  
  shadows: {
    soft: 'var(--shadow-soft)',
    card: 'var(--shadow-card)',
    dashboard: 'var(--shadow-dashboard)'
  },
  
  spacing: {
    radius: 'var(--radius)'
  }
} as const

// Type helpers for design tokens
export type BrandColor = keyof typeof designTokens.colors.brand
export type PastelColor = keyof typeof designTokens.colors.pastel  
export type ChartColor = keyof typeof designTokens.colors.chart
export type GradientType = keyof typeof designTokens.gradients
export type ShadowType = keyof typeof designTokens.shadows