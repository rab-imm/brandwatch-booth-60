import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        eyebrow: "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted",
        "pastel-peach": "border-transparent bg-pastel-peach text-pastel-peach-foreground hover:bg-pastel-peach/80",
        "pastel-sage": "border-transparent bg-pastel-sage text-pastel-sage-foreground hover:bg-pastel-sage/80",
        "pastel-lavender": "border-transparent bg-pastel-lavender text-pastel-lavender-foreground hover:bg-pastel-lavender/80",
        "pastel-sky": "border-transparent bg-pastel-sky text-pastel-sky-foreground hover:bg-pastel-sky/80",
        "pastel-sand": "border-transparent bg-pastel-sand text-pastel-sand-foreground hover:bg-pastel-sand/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
