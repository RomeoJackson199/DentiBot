import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "rounded-lg text-card-foreground transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-card border shadow-sm",
        glass: "glass-card border-white/20",
        "glass-strong": "glass-card-strong border-white/30",
        floating: "floating-card",
        elevated: "card-elevated",
        interactive: "card-interactive",
        outline: "border-2 border-dental-primary/20 bg-card/50 hover:border-dental-primary/40",
        gradient: "bg-gradient-card border-0 text-white shadow-elegant",
        // New sophisticated variants
        "elegant": "bg-card/80 backdrop-blur-sm border border-border/50 shadow-soft hover:shadow-medium",
        "minimal": "bg-transparent border border-border/30 hover:border-border/60",
        "glow": "bg-card border border-dental-primary/20 shadow-glow hover:shadow-xl",
        "neon": "bg-transparent border border-dental-primary text-dental-primary hover:bg-dental-primary/10",
        "hero": "bg-gradient-hero border border-white/10 shadow-elegant",
        "feature": "bg-card border border-border/50 shadow-soft hover:shadow-medium hover:border-dental-primary/30",
      },
      padding: {
        none: "",
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
        xl: "p-10",
        // New mobile-optimized padding
        "mobile": "p-4 sm:p-6",
        "mobile-lg": "p-6 sm:p-8",
      },
      rounded: {
        none: "rounded-none",
        sm: "rounded-sm",
        default: "rounded-lg",
        lg: "rounded-xl",
        xl: "rounded-2xl",
        "2xl": "rounded-3xl",
        // New mobile-optimized rounded
        "mobile": "rounded-xl sm:rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
      rounded: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean
  hover?: boolean
  glow?: boolean
  pulse?: boolean
  animated?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, rounded, hover, glow, pulse, animated, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        cardVariants({ variant, padding, rounded }),
        hover && "hover:shadow-elegant hover:-translate-y-1",
        glow && "hover:shadow-glow",
        pulse && "animate-pulse-soft",
        animated && "animate-fade-in",
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    gradient?: boolean
    centered?: boolean
  }
>(({ className, gradient, centered, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5 p-6",
      gradient && "bg-gradient-primary text-white rounded-t-lg -m-6 mb-6 p-6",
      centered && "text-center items-center",
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    gradient?: boolean
    size?: "sm" | "default" | "lg" | "xl"
    centered?: boolean
  }
>(({ className, gradient, size = "default", centered, ...props }, ref) => {
  const sizeClasses = {
    sm: "text-lg font-semibold",
    default: "text-2xl font-semibold",
    lg: "text-3xl font-bold", 
    xl: "text-4xl font-bold",
  }

  return (
    <h3
      ref={ref}
      className={cn(
        sizeClasses[size],
        "leading-none tracking-tight",
        gradient && "gradient-text",
        centered && "text-center",
        className
      )}
      {...props}
    />
  )
})
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {
    size?: "sm" | "default" | "lg"
    centered?: boolean
  }
>(({ className, size = "default", centered, ...props }, ref) => {
  const sizeClasses = {
    sm: "text-xs",
    default: "text-sm",
    lg: "text-base",
  }

  return (
    <p
      ref={ref}
      className={cn(
        sizeClasses[size],
        "text-muted-foreground leading-relaxed",
        centered && "text-center",
        className
      )}
      {...props}
    />
  )
})
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    padding?: "none" | "sm" | "default" | "lg"
    centered?: boolean
  }
>(({ className, padding = "default", centered, ...props }, ref) => {
  const paddingClasses = {
    none: "",
    sm: "p-4 pt-0",
    default: "p-6 pt-0",
    lg: "p-8 pt-0",
  }

  return (
    <div 
      ref={ref} 
      className={cn(
        paddingClasses[padding],
        centered && "text-center",
        className
      )} 
      {...props} 
    />
  )
})
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    gradient?: boolean
    padding?: "none" | "sm" | "default" | "lg"
    centered?: boolean
  }
>(({ className, gradient, padding = "default", centered, ...props }, ref) => {
  const paddingClasses = {
    none: "pt-0",
    sm: "flex items-center p-4 pt-0",
    default: "flex items-center p-6 pt-0",
    lg: "flex items-center p-8 pt-0",
  }

  return (
    <div
      ref={ref}
      className={cn(
        paddingClasses[padding],
        gradient && "bg-gradient-secondary text-white rounded-b-lg -m-6 mt-6 p-6",
        centered && "justify-center",
        className
      )}
      {...props}
    />
  )
})
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants }
