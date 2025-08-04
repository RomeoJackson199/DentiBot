import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dental-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft hover:shadow-medium active:scale-95",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-soft hover:shadow-medium active:scale-95",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-dental-primary/50 active:scale-95",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-soft hover:shadow-medium active:scale-95",
        ghost: "hover:bg-accent hover:text-accent-foreground active:scale-95",
        link: "text-primary underline-offset-4 hover:underline",
        // New modern variants
        gradient: "bg-gradient-primary text-white shadow-elegant hover:shadow-glow hover:scale-105 active:scale-95 btn-glow",
        "gradient-secondary": "bg-gradient-secondary text-white shadow-elegant hover:shadow-glow hover:scale-105 active:scale-95 btn-glow",
        "gradient-accent": "bg-gradient-accent text-white shadow-elegant hover:shadow-glow hover:scale-105 active:scale-95 btn-glow",
        glass: "glass-card text-dental-primary backdrop-blur-xl hover:bg-white/20 hover:scale-105 hover:shadow-elegant active:scale-95",
        "glass-strong": "glass-card-strong text-dental-primary backdrop-blur-2xl hover:bg-white/30 hover:scale-105 hover:shadow-glow active:scale-95",
        floating: "floating-card text-dental-primary hover:shadow-glow hover:scale-105 active:scale-95",
        success: "bg-success text-white hover:bg-success/90 shadow-soft hover:shadow-medium active:scale-95",
        warning: "bg-warning text-white hover:bg-warning/90 shadow-soft hover:shadow-medium active:scale-95",
        error: "bg-error text-white hover:bg-error/90 shadow-soft hover:shadow-medium active:scale-95",
        info: "bg-info text-white hover:bg-info/90 shadow-soft hover:shadow-medium active:scale-95",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base font-semibold",
        xl: "h-14 rounded-xl px-10 text-lg font-semibold",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
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
  loading?: boolean
  icon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, icon, rightIcon, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
        )}
        {!loading && icon && icon}
        {children}
        {!loading && rightIcon && rightIcon}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
