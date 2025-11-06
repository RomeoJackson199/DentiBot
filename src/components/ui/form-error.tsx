import * as React from "react"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FormErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  id?: string
}

/**
 * Accessible form error message component
 * Automatically includes ARIA live region for screen readers
 */
export const FormError = React.forwardRef<HTMLDivElement, FormErrorProps>(
  ({ children, className, id, ...props }, ref) => {
    return (
      <div
        ref={ref}
        id={id}
        role="alert"
        aria-live="polite"
        className={cn(
          "mt-1.5 flex items-start gap-2 text-sm text-destructive",
          className
        )}
        {...props}
      >
        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
        <span>{children}</span>
      </div>
    )
  }
)
FormError.displayName = "FormError"

/**
 * Example usage:
 *
 * <Label htmlFor="email">Email</Label>
 * <Input
 *   id="email"
 *   type="email"
 *   error={!!errors.email}
 *   aria-describedby={errors.email ? "email-error" : undefined}
 * />
 * {errors.email && (
 *   <FormError id="email-error">
 *     {errors.email.message}
 *   </FormError>
 * )}
 */
