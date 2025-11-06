import * as React from "react"
import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SuccessAnimationProps {
  /**
   * Show the animation
   */
  show?: boolean

  /**
   * Size of the checkmark
   */
  size?: "sm" | "md" | "lg" | "xl"

  /**
   * Success message to display
   */
  message?: string

  /**
   * Additional className
   */
  className?: string

  /**
   * Callback when animation completes
   */
  onComplete?: () => void
}

const sizes = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
  xl: "h-24 w-24",
}

/**
 * Animated success checkmark
 * Perfect for confirming appointments, payments, etc.
 *
 * @example
 * // Show after successful booking
 * const [showSuccess, setShowSuccess] = useState(false)
 *
 * const handleBooking = async () => {
 *   await bookAppointment()
 *   setShowSuccess(true)
 * }
 *
 * <SuccessAnimation
 *   show={showSuccess}
 *   message="Appointment booked!"
 *   size="lg"
 *   onComplete={() => navigate('/appointments')}
 * />
 */
export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  show = false,
  size = "lg",
  message,
  className,
  onComplete,
}) => {
  React.useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, 2000)
      return () => clearTimeout(timer)
    }
  }, [show, onComplete])

  if (!show) return null

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 p-8",
        "animate-scale-in",
        className
      )}
    >
      <div className="relative">
        {/* Pulsing ring */}
        <div
          className={cn(
            "absolute inset-0 rounded-full bg-success-600/20",
            "animate-pulse-ring"
          )}
        />

        {/* Checkmark icon */}
        <CheckCircle2
          className={cn(
            sizes[size],
            "text-success-600 animate-scale-in",
            "relative z-10"
          )}
          strokeWidth={2.5}
        />
      </div>

      {message && (
        <p className="text-lg font-semibold text-success-800 animate-fade-in">
          {message}
        </p>
      )}
    </div>
  )
}

/**
 * Inline success checkmark (smaller, for forms)
 */
export interface InlineSuccessProps {
  show?: boolean
  message?: string
  className?: string
}

export const InlineSuccess: React.FC<InlineSuccessProps> = ({
  show = false,
  message = "Success!",
  className,
}) => {
  if (!show) return null

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-success-600 animate-slide-in",
        className
      )}
    >
      <CheckCircle2 className="h-5 w-5" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  )
}
