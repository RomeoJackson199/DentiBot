import * as React from "react"
import { cn } from "@/lib/utils"

export interface LiveRegionProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Politeness level for screen readers
   * - "polite": Announce when user is idle (default)
   * - "assertive": Interrupt user immediately
   * - "off": Don't announce
   */
  politeness?: "polite" | "assertive" | "off"

  /**
   * Atomic announcements - announce entire region vs just changes
   */
  atomic?: boolean

  /**
   * Relevant changes to announce
   * - "additions": Only announce additions
   * - "removals": Only announce removals
   * - "text": Only announce text changes
   * - "all": Announce all changes (default)
   */
  relevant?: "additions" | "removals" | "text" | "all"

  /**
   * Visual styling (often live regions are visually hidden)
   */
  visuallyHidden?: boolean
}

/**
 * Accessible live region for dynamic content updates
 * Announces changes to screen reader users without moving focus
 *
 * @example
 * // Announce successful save
 * <LiveRegion politeness="polite">
 *   {saveStatus === 'success' && 'Changes saved successfully'}
 * </LiveRegion>
 *
 * @example
 * // Announce urgent error
 * <LiveRegion politeness="assertive">
 *   {error && `Error: ${error.message}`}
 * </LiveRegion>
 *
 * @example
 * // Loading indicator for screen readers
 * <LiveRegion visuallyHidden>
 *   {isLoading && 'Loading appointments...'}
 * </LiveRegion>
 */
export const LiveRegion = React.forwardRef<HTMLDivElement, LiveRegionProps>(
  ({
    children,
    className,
    politeness = "polite",
    atomic = false,
    relevant = "all",
    visuallyHidden = false,
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-live={politeness}
        aria-atomic={atomic}
        aria-relevant={relevant}
        className={cn(
          visuallyHidden && "sr-only",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
LiveRegion.displayName = "LiveRegion"

/**
 * Screen reader only text (visually hidden but announced)
 */
export const ScreenReaderOnly = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ children, className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn("sr-only", className)}
    {...props}
  >
    {children}
  </span>
))
ScreenReaderOnly.displayName = "ScreenReaderOnly"
