import * as React from "react"
import { cn } from "@/lib/utils"

export interface ShimmerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether the shimmer effect is active
   */
  active?: boolean

  /**
   * Shimmer color
   */
  color?: string
}

/**
 * Shimmer loading effect
 * Great for skeleton screens and loading states
 *
 * @example
 * // Loading card with shimmer
 * <Card className="relative overflow-hidden">
 *   <Shimmer active={isLoading} />
 *   <CardContent>
 *     {/* content */}
 *   </CardContent>
 * </Card>
 *
 * @example
 * // Shimmer button
 * <Button className="relative overflow-hidden">
 *   <Shimmer active />
 *   <span className="relative z-10">Loading...</span>
 * </Button>
 */
export const Shimmer = React.forwardRef<HTMLDivElement, ShimmerProps>(
  ({ className, active = true, color, ...props }, ref) => {
    if (!active) return null

    return (
      <div
        ref={ref}
        className={cn(
          "absolute inset-0 -z-1",
          "bg-gradient-to-r from-transparent via-white/20 to-transparent",
          "animate-shimmer",
          "pointer-events-none",
          className
        )}
        style={{
          backgroundSize: "200% 100%",
          ...(color && {
            backgroundImage: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          }),
        }}
        aria-hidden="true"
        {...props}
      />
    )
  }
)
Shimmer.displayName = "Shimmer"

/**
 * Shimmer wrapper component
 * Wraps content with shimmer effect
 */
export interface ShimmerWrapperProps {
  children: React.ReactNode
  isLoading?: boolean
  className?: string
}

export const ShimmerWrapper: React.FC<ShimmerWrapperProps> = ({
  children,
  isLoading = false,
  className,
}) => {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Shimmer active={isLoading} />
      <div className={cn(isLoading && "opacity-50")}>{children}</div>
    </div>
  )
}
