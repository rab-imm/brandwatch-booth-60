import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "rounded-md bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "rounded-md border border-input bg-background/80 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "rounded-md hover:bg-accent hover:text-accent-foreground",
        "ghost-contrast": "rounded-md text-white hover:bg-white/10 hover:text-white",
        "outline-contrast": "rounded-md border border-white/30 bg-transparent text-white hover:bg-white/10 hover:border-white/50",
        link: "text-primary underline-offset-4 hover:underline",
        premium: "rounded-full bg-brand-accent text-white hover:bg-brand-primary shadow-soft hover:shadow-card uppercase tracking-wide font-semibold",
        "pastel-peach": "rounded-full border border-muted bg-background text-foreground hover:bg-pastel-peach hover:text-pastel-peach-foreground hover:border-pastel-peach shadow-soft hover:shadow-card uppercase tracking-wide font-semibold transition-all",
        "pastel-sage": "rounded-full border border-muted bg-background text-foreground hover:bg-pastel-sage hover:text-pastel-sage-foreground hover:border-pastel-sage shadow-soft hover:shadow-card uppercase tracking-wide font-semibold transition-all",
        "pastel-lavender": "rounded-full border border-muted bg-background text-foreground hover:bg-pastel-lavender hover:text-pastel-lavender-foreground hover:border-pastel-lavender shadow-soft hover:shadow-card uppercase tracking-wide font-semibold transition-all",
        "pastel-sky": "rounded-full border border-muted bg-background text-foreground hover:bg-pastel-sky hover:text-pastel-sky-foreground hover:border-pastel-sky shadow-soft hover:shadow-card uppercase tracking-wide font-semibold transition-all",
        "pastel-sand": "rounded-full border border-muted bg-background text-foreground hover:bg-pastel-sand hover:text-pastel-sand-foreground hover:border-pastel-sand shadow-soft hover:shadow-card uppercase tracking-wide font-semibold transition-all",
        "pastel-outline": "rounded-full border-2 border-pastel-peach bg-transparent text-pastel-peach-foreground hover:bg-pastel-peach/10 uppercase tracking-wide font-semibold transition-all",
        subtle: "rounded-full bg-muted/30 text-muted-foreground hover:bg-pastel-peach/20 hover:text-foreground uppercase tracking-wide font-semibold transition-all",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-9 px-4",
        lg: "h-12 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
