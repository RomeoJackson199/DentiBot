import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden touch-target",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-soft hover:shadow-elegant hover:scale-[1.02] active:scale-[0.98] active:shadow-inner",
        destructive: "bg-destructive text-destructive-foreground shadow-soft hover:shadow-elegant hover:scale-[1.02] active:scale-[0.98]",
        outline: "border-2 border-input bg-background shadow-soft hover:bg-accent/10 hover:border-primary hover:scale-[1.02] active:scale-[0.98]",
        secondary: "bg-secondary text-secondary-foreground shadow-soft hover:bg-secondary/80 hover:scale-[1.02] active:scale-[0.98]",
        ghost: "hover:bg-accent/10 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Modern DentiBot variants
        gradient: "bg-gradient-primary text-white shadow-elegant hover:shadow-glow hover:scale-[1.02] active:scale-[0.98]",
        aqua: "bg-secondary text-white shadow-soft hover:shadow-elegant hover:scale-[1.02] active:scale-[0.98]",
        lilac: "bg-accent text-accent-foreground shadow-soft hover:shadow-elegant hover:scale-[1.02] active:scale-[0.98]",
        glass: "bg-white/10 backdrop-blur-sm border-2 border-white/20 text-foreground hover:bg-white/20 hover:scale-[1.02] active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-xl px-3 text-xs",
        lg: "h-12 rounded-2xl px-8 text-base",
        icon: "h-10 w-10",
        desktop: "h-11 px-8",
        mobile: "h-12 px-6 text-base",
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

    const content = (
      <>
        {loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
        )}
        {!loading && icon && icon}
        {children}
        {!loading && rightIcon && rightIcon}
      </>
    )

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {asChild ? children : content}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
