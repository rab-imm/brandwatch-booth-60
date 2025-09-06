import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/Icon"
import { cva, type VariantProps } from "class-variance-authority"

const iconBadgeVariants = cva(
  "inline-flex items-center justify-center rounded-full shadow-soft transition-colors",
  {
    variants: {
      tone: {
        // Flat fills with proper contrast - no gradients
        sage: "bg-pastel-sage text-sage-foreground",
        peach: "bg-pastel-peach text-peach-foreground", 
        lavender: "bg-pastel-lavender text-lavender-foreground",
        sky: "bg-pastel-sky text-sky-foreground",
        sand: "bg-pastel-sand text-sand-foreground",
        // Semantic variants
        primary: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        accent: "bg-accent text-accent-foreground",
        brand: "bg-brand-primary text-brand-secondary"
      },
      size: {
        sm: "h-8 w-8",
        md: "h-12 w-12", 
        lg: "h-16 w-16",
        xl: "h-20 w-20"
      },
      shape: {
        circle: "rounded-full",
        square: "rounded-lg"
      },
      elevated: {
        true: "shadow-card hover:shadow-elevated",
        false: "shadow-soft"
      }
    },
    defaultVariants: {
      tone: "primary",
      size: "md",
      shape: "circle",
      elevated: false
    }
  }
)

const iconSizeMap = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 40
} as const

export interface IconBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof iconBadgeVariants> {
  icon: string
  iconSize?: number
}

const IconBadge = React.forwardRef<HTMLDivElement, IconBadgeProps>(
  ({ className, tone, size, shape, elevated, icon, iconSize, ...props }, ref) => {
    const computedIconSize = iconSize || iconSizeMap[size || "md"]
    
    return (
      <div
        className={cn(iconBadgeVariants({ tone, size, shape, elevated }), className)}
        ref={ref}
        {...props}
      >
        <Icon 
          name={icon} 
          size={computedIconSize}
          className="shrink-0"
        />
      </div>
    )
  }
)
IconBadge.displayName = "IconBadge"

export { IconBadge, iconBadgeVariants }