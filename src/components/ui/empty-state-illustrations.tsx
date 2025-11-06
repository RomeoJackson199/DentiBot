import * as React from "react"
import { Calendar, MessageSquare, FileText, CreditCard, Users, Clock, Search, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface EmptyStateIllustrationProps {
  type: "appointments" | "messages" | "records" | "payments" | "patients" | "search" | "completed"
  className?: string
}

/**
 * Simple, friendly illustrations for empty states
 * Uses Lucide icons with decorative backgrounds
 */
export const EmptyStateIllustration: React.FC<EmptyStateIllustrationProps> = ({
  type,
  className,
}) => {
  const illustrations = {
    appointments: {
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      description: "No appointments",
    },
    messages: {
      icon: MessageSquare,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      description: "No messages",
    },
    records: {
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      description: "No records",
    },
    payments: {
      icon: CreditCard,
      color: "text-green-600",
      bgColor: "bg-green-100",
      description: "No payments",
    },
    patients: {
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      description: "No patients",
    },
    search: {
      icon: Search,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      description: "No results",
    },
    completed: {
      icon: CheckCircle2,
      color: "text-success-600",
      bgColor: "bg-success-100",
      description: "All done",
    },
  }

  const { icon: Icon, color, bgColor, description } = illustrations[type]

  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        "w-32 h-32 md:w-40 md:h-40",
        className
      )}
      role="img"
      aria-label={description}
    >
      {/* Decorative background circles */}
      <div
        className={cn(
          "absolute inset-0 rounded-full opacity-10",
          bgColor,
          "animate-pulse"
        )}
      />
      <div
        className={cn(
          "absolute inset-4 rounded-full opacity-20",
          bgColor,
          "animate-pulse",
          "animation-delay-150"
        )}
      />

      {/* Icon */}
      <div
        className={cn(
          "relative z-10 p-6 rounded-full",
          bgColor,
          "shadow-soft"
        )}
      >
        <Icon
          className={cn("h-12 w-12 md:h-16 md:w-16", color)}
          strokeWidth={1.5}
        />
      </div>
    </div>
  )
}

/**
 * Enhanced empty state component with illustration
 */
export interface EnhancedEmptyStateProps {
  type: EmptyStateIllustrationProps["type"]
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export const EnhancedEmptyState: React.FC<EnhancedEmptyStateProps> = ({
  type,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center",
        "text-center p-8 md:p-12",
        "animate-fade-in",
        className
      )}
    >
      <EmptyStateIllustration type={type} className="mb-6" />

      <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-muted-foreground text-sm md:text-base mb-6 max-w-md">
          {description}
        </p>
      )}

      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

/**
 * Animated illustration for app loading
 */
export const LoadingIllustration: React.FC<{ className?: string }> = ({
  className,
}) => {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        "w-24 h-24",
        className
      )}
      role="status"
      aria-label="Loading"
    >
      {/* Rotating circles */}
      <div className="absolute inset-0">
        <div
          className={cn(
            "absolute inset-0 rounded-full",
            "border-4 border-dental-primary/20",
            "border-t-dental-primary",
            "animate-spin"
          )}
        />
      </div>
      <div className="absolute inset-2">
        <div
          className={cn(
            "absolute inset-0 rounded-full",
            "border-4 border-dental-secondary/20",
            "border-t-dental-secondary",
            "animate-spin",
            "animation-delay-150"
          )}
          style={{ animationDirection: "reverse" }}
        />
      </div>

      {/* Center logo/icon */}
      <Clock
        className="h-8 w-8 text-dental-primary animate-pulse"
        strokeWidth={2}
      />
    </div>
  )
}

// Add this to your global CSS for animation delay:
/*
.animation-delay-150 {
  animation-delay: 150ms;
}

.animation-delay-300 {
  animation-delay: 300ms;
}
*/
