import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { iconRegistry, IconProps, getPhosphorWeight } from './icons.registry'

interface UnifiedIconProps extends IconProps {
  name: keyof typeof iconRegistry | string // Type-safe icon names
  className?: string
  size?: number | string
  color?: string
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'
  // Common aliases for better DX
  'aria-hidden'?: boolean
  role?: string
  style?: React.CSSProperties
}

export const Icon = forwardRef<SVGSVGElement, UnifiedIconProps>(
  ({ name, className, size = 20, color = 'currentColor', weight = 'regular', 'aria-hidden': ariaHidden = true, style, ...props }, ref) => {
    const IconComponent = iconRegistry[name as keyof typeof iconRegistry]
    
    if (!IconComponent) {
      console.warn(`Icon "${name}" not found in registry. Available icons:`, Object.keys(iconRegistry))
      return null
    }

    // Determine icon library and apply appropriate props
    const iconProps: any = {
      ref,
      className: cn('inline-block', className),
      'aria-hidden': ariaHidden,
      style,
      ...props
    }

    // Phosphor icons (have weight system)
    const phosphorIcons = [
      'chart-line', 'eye', 'brain', 'lightning', 'globe', 'star', 'heart', 
      'arrow-right', 'play', 'download', 'check', 'info', 'warning', 'close'
    ]
    
    if (phosphorIcons.includes(name)) {
      iconProps.size = size
      iconProps.color = color
      iconProps.weight = getPhosphorWeight(weight)
    }
    // Tabler icons (consistent sizing)
    else if (name.startsWith('brand-') || ['analytics', 'dashboard', 'shield', 'users', 'list'].includes(name)) {
      iconProps.size = size
      iconProps.stroke = color
      iconProps.strokeWidth = weight === 'bold' ? 2.5 : weight === 'light' ? 1.25 : 1.5
    }
    // Iconoir icons (stroke-based)
    else if (['target', 'rocket', 'grid'].includes(name)) {
      iconProps.width = size
      iconProps.height = size
      iconProps.color = color
      iconProps.strokeWidth = weight === 'bold' ? 2 : weight === 'light' ? 1.25 : 1.5
    }
    // Radix icons (system default)
    else {
      iconProps.width = size
      iconProps.height = size
      iconProps.color = color
    }

    return <IconComponent {...iconProps} />
  }
)

Icon.displayName = 'Icon'

// Convenience component for common icon patterns
export const IconButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { 
    icon: string
    iconSize?: number | string
    iconWeight?: UnifiedIconProps['weight']
  }
>(({ icon, iconSize = 16, iconWeight = 'regular', className, children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'text-muted-foreground hover:text-foreground',
        'transition-colors duration-200',
        className
      )}
      {...props}
    >
      <Icon name={icon} size={iconSize} weight={iconWeight} />
      {children}
    </button>
  )
})

IconButton.displayName = 'IconButton'