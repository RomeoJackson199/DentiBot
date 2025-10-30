import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:shadow-glow disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden touch-target btn-ripple btn-glow hover:-translate-y-0.5",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-dental-primary via-dental-secondary to-dental-accent text-white shadow-glow hover:shadow-elegant hover:brightness-110 active:scale-[0.99]",
        destructive:
          "bg-dental-accent text-dental-accent-foreground shadow-soft hover:shadow-elegant hover:brightness-105 active:scale-[0.99]",
        outline:
          "border-2 border-dental-primary/30 bg-white/80 text-dental-primary shadow-soft hover:border-dental-primary/50 hover:bg-dental-surface/50 active:scale-[0.99] dark:bg-background/60 dark:text-dental-foreground",
        secondary:
          "bg-white/90 text-dental-primary border border-dental-primary/20 shadow-soft rounded-xl hover:border-dental-primary/35 hover:bg-dental-surface/70 active:scale-[0.99] dark:bg-background/60 dark:text-dental-foreground dark:border-dental-primary/35 dark:hover:bg-background/80",
        ghost: "text-dental-primary hover:bg-dental-primary/10 active:scale-[0.99]",
        link: "text-dental-primary underline-offset-4 hover:underline",
        // Modern DentiBot variants
        gradient:
          "bg-gradient-to-r from-dental-primary via-dental-secondary to-dental-accent text-white shadow-glow hover:shadow-elegant hover:brightness-110 active:scale-[0.99]",
        aqua:
          "bg-dental-secondary text-dental-secondary-foreground shadow-soft hover:shadow-elegant hover:brightness-110 active:scale-[0.99]",
        lilac:
          "bg-accent text-accent-foreground shadow-soft hover:shadow-elegant hover:brightness-110 active:scale-[0.99]",
        glass:
          "bg-white/10 backdrop-blur-md border-2 border-white/30 text-foreground hover:bg-white/20 hover:shadow-elegant active:scale-[0.99] dark:bg-white/5 dark:border-white/10",
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
          <span className="flex items-center justify-center">
            <span
              aria-hidden="true"
              className="inline-flex h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"
            />
          </span>
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
