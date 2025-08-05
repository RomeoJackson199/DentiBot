import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// Enhanced loading components
function LoadingSpinner({ 
  size = "default", 
  variant = "default",
  className 
}: { 
  size?: "sm" | "default" | "lg" | "xl"
  variant?: "default" | "gradient" | "glow"
  className?: string 
}) {
  const sizeClasses = {
    sm: "w-4 h-4",
    default: "w-6 h-6", 
    lg: "w-8 h-8",
    xl: "w-12 h-12"
  }

  const variantClasses = {
    default: "border-dental-primary",
    gradient: "border-dental-primary bg-gradient-primary",
    glow: "border-dental-primary shadow-glow"
  }

  return (
    <div className={cn(
      "animate-spin rounded-full border-2 border-t-transparent",
      sizeClasses[size],
      variantClasses[variant],
      className
    )} />
  )
}

function LoadingCard({ 
  variant = "default",
  className 
}: { 
  variant?: "default" | "glass" | "elegant"
  className?: string 
}) {
  const variantClasses = {
    default: "bg-card border border-border",
    glass: "glass-card border-white/20",
    elegant: "bg-card/80 backdrop-blur-sm border border-border/50"
  }

  return (
    <div className={cn(
      "rounded-lg p-6 space-y-4",
      variantClasses[variant],
      className
    )}>
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

function LoadingGrid({ 
  columns = 3,
  className 
}: { 
  columns?: number
  className?: string 
}) {
  return (
    <div className={cn(
      "grid gap-4",
      columns === 2 && "grid-cols-1 sm:grid-cols-2",
      columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      columns === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
      className
    )}>
      {Array.from({ length: columns }).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  )
}

function LoadingPage({ 
  title = "Loading...",
  subtitle = "Please wait while we prepare your experience",
  variant = "default",
  className 
}: { 
  title?: string
  subtitle?: string
  variant?: "default" | "glass" | "elegant"
  className?: string 
}) {
  const variantClasses = {
    default: "bg-card border border-border",
    glass: "glass-card border-white/20",
    elegant: "bg-card/80 backdrop-blur-sm border border-border/50"
  }

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center">
      <div className={cn(
        "animate-fade-in p-10 max-w-md mx-auto",
        variantClasses[variant],
        className
      )}>
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto shadow-elegant animate-float">
              <LoadingSpinner size="lg" variant="glow" className="text-white" />
            </div>
            <div className="pulse-ring w-20 h-20 -top-2 -left-2"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold gradient-text">{title}</h3>
            <p className="text-dental-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoadingMessage({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-start space-x-3 max-w-md animate-fade-in", className)}>
      <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center shadow-elegant">
        <div className="w-5 h-5 bg-white rounded-full" />
      </div>
      <div className="bg-card/80 backdrop-blur-sm rounded-lg p-4 flex-1">
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-dental-primary rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-dental-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
          <div className="w-2 h-2 bg-dental-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
        </div>
      </div>
    </div>
  )
}

export { Skeleton, LoadingSpinner, LoadingCard, LoadingGrid, LoadingPage, LoadingMessage }