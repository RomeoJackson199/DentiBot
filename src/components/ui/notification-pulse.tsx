import * as React from "react"
import { cn } from "@/lib/utils"

export interface NotificationPulseProps {
  /**
   * Show the pulse animation
   */
  show?: boolean

  /**
   * Count to display (optional)
   */
  count?: number

  /**
   * Size of the badge
   */
  size?: "sm" | "md" | "lg"

  /**
   * Color variant
   */
  variant?: "default" | "success" | "warning" | "danger"

  /**
   * Position relative to parent
   */
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left"

  /**
   * Additional className
   */
  className?: string
}

const sizes = {
  sm: "h-2 w-2",
  md: "h-3 w-3",
  lg: "h-4 w-4",
}

const sizeWithCount = {
  sm: "h-4 w-4 text-[10px]",
  md: "h-5 w-5 text-xs",
  lg: "h-6 w-6 text-sm",
}

const variants = {
  default: "bg-dental-primary",
  success: "bg-success-600",
  warning: "bg-warning-600",
  danger: "bg-danger-600",
}

const positions = {
  "top-right": "top-0 right-0 -translate-y-1/2 translate-x-1/2",
  "top-left": "top-0 left-0 -translate-y-1/2 -translate-x-1/2",
  "bottom-right": "bottom-0 right-0 translate-y-1/2 translate-x-1/2",
  "bottom-left": "bottom-0 left-0 translate-y-1/2 -translate-x-1/2",
}

/**
 * Animated notification badge/pulse
 * Perfect for notification icons, message counts, etc.
 *
 * @example
 * // Notification icon with pulse
 * <div className="relative">
 *   <Bell className="h-6 w-6" />
 *   <NotificationPulse
 *     show={unreadCount > 0}
 *     count={unreadCount}
 *     variant="danger"
 *   />
 * </div>
 *
 * @example
 * // Simple pulse indicator (no count)
 * <div className="relative">
 *   <MessageSquare className="h-6 w-6" />
 *   <NotificationPulse
 *     show={hasNewMessages}
 *     size="sm"
 *     variant="success"
 *   />
 * </div>
 */
export const NotificationPulse = React.forwardRef<
  HTMLDivElement,
  NotificationPulseProps
>(
  (
    {
      show = false,
      count,
      size = "md",
      variant = "danger",
      position = "top-right",
      className,
    },
    ref
  ) => {
    if (!show) return null

    const hasCount = typeof count === "number" && count > 0

    return (
      <div
        ref={ref}
        className={cn(
          "absolute z-10",
          "rounded-full",
          "flex items-center justify-center",
          "text-white font-bold",
          "shadow-elegant",
          hasCount ? sizeWithCount[size] : sizes[size],
          variants[variant],
          positions[position],
          className
        )}
      >
        {/* Pulsing ring animation */}
        <div
          className={cn(
            "absolute inset-0 rounded-full",
            variants[variant],
            "opacity-75 animate-pulse-ring"
          )}
        />

        {/* Count or dot */}
        {hasCount ? (
          <span className="relative z-10">
            {count > 99 ? "99+" : count}
          </span>
        ) : (
          <span className="sr-only">New notification</span>
        )}
      </div>
    )
  }
)
NotificationPulse.displayName = "NotificationPulse"

/**
 * Status pulse indicator (online/offline/busy)
 */
export interface StatusPulseProps {
  status: "online" | "offline" | "busy" | "away"
  size?: "sm" | "md" | "lg"
  className?: string
}

const statusVariants = {
  online: "bg-success-600",
  offline: "bg-gray-400",
  busy: "bg-danger-600",
  away: "bg-warning-600",
}

export const StatusPulse: React.FC<StatusPulseProps> = ({
  status,
  size = "md",
  className,
}) => {
  return (
    <div className={cn("relative", className)}>
      {/* Pulsing ring for online/busy status */}
      {(status === "online" || status === "busy") && (
        <div
          className={cn(
            "absolute inset-0 rounded-full",
            statusVariants[status],
            "opacity-75 animate-pulse-ring"
          )}
        />
      )}

      {/* Status dot */}
      <div
        className={cn(
          "rounded-full relative z-10",
          sizes[size],
          statusVariants[status]
        )}
        role="status"
        aria-label={`Status: ${status}`}
      />
    </div>
  )
}
StatusPulse.displayName = "StatusPulse"
