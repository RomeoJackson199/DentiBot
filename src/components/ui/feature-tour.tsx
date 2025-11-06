import * as React from "react"
import { X, ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface TourStep {
  /**
   * Unique identifier for the step
   */
  id: string

  /**
   * Step title
   */
  title: string

  /**
   * Step description/content
   */
  content: string

  /**
   * CSS selector for element to highlight
   * e.g., "#booking-button" or ".appointment-card"
   */
  target?: string

  /**
   * Position of tooltip relative to target
   */
  placement?: "top" | "bottom" | "left" | "right" | "center"

  /**
   * Optional image or icon
   */
  image?: React.ReactNode

  /**
   * Action to perform when reaching this step
   */
  onEnter?: () => void

  /**
   * Action to perform when leaving this step
   */
  onLeave?: () => void
}

export interface FeatureTourProps {
  /**
   * Tour steps
   */
  steps: TourStep[]

  /**
   * Whether the tour is active
   */
  isOpen: boolean

  /**
   * Callback when tour completes
   */
  onComplete: () => void

  /**
   * Callback when tour is skipped
   */
  onSkip: () => void

  /**
   * Show skip button
   */
  showSkip?: boolean

  /**
   * Auto-advance delay (ms), 0 to disable
   */
  autoAdvanceDelay?: number
}

/**
 * Interactive feature tour/onboarding component
 * Highlights features and guides users through the app
 *
 * @example
 * const tourSteps: TourStep[] = [
 *   {
 *     id: "welcome",
 *     title: "Welcome to Caberu!",
 *     content: "Let's take a quick tour of your new appointment system",
 *     placement: "center"
 *   },
 *   {
 *     id: "booking",
 *     title: "Book Appointments",
 *     content: "Click here to book a new appointment with AI assistance",
 *     target: "#booking-button",
 *     placement: "bottom"
 *   },
 *   // ... more steps
 * ]
 *
 * <FeatureTour
 *   steps={tourSteps}
 *   isOpen={showTour}
 *   onComplete={() => setShowTour(false)}
 *   onSkip={() => setShowTour(false)}
 * />
 */
export const FeatureTour: React.FC<FeatureTourProps> = ({
  steps,
  isOpen,
  onComplete,
  onSkip,
  showSkip = true,
  autoAdvanceDelay = 0,
}) => {
  const [currentStep, setCurrentStep] = React.useState(0)
  const [highlightRect, setHighlightRect] = React.useState<DOMRect | null>(null)

  const step = steps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1

  // Update highlight position when step changes
  React.useEffect(() => {
    if (!isOpen || !step?.target) {
      setHighlightRect(null)
      return
    }

    const element = document.querySelector(step.target)
    if (element) {
      const rect = element.getBoundingClientRect()
      setHighlightRect(rect)

      // Scroll element into view
      element.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [isOpen, step])

  // Call step callbacks
  React.useEffect(() => {
    if (isOpen && step) {
      step.onEnter?.()
      return () => step.onLeave?.()
    }
  }, [isOpen, step])

  // Auto-advance
  React.useEffect(() => {
    if (isOpen && autoAdvanceDelay > 0 && !isLastStep) {
      const timer = setTimeout(() => {
        handleNext()
      }, autoAdvanceDelay)
      return () => clearTimeout(timer)
    }
  }, [isOpen, currentStep, autoAdvanceDelay, isLastStep])

  const handleNext = () => {
    if (isLastStep) {
      onComplete()
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1))
  }

  const handleSkip = () => {
    onSkip()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={handleSkip}
      />

      {/* Highlight spotlight */}
      {highlightRect && (
        <div
          className="fixed z-[51] pointer-events-none"
          style={{
            top: highlightRect.top - 4,
            left: highlightRect.left - 4,
            width: highlightRect.width + 8,
            height: highlightRect.height + 8,
            boxShadow:
              "0 0 0 4px rgba(255, 255, 255, 0.3), 0 0 0 9999px rgba(0, 0, 0, 0.5)",
            borderRadius: "8px",
            transition: "all 0.3s ease-in-out",
          }}
        />
      )}

      {/* Tour card */}
      <div
        className={cn(
          "fixed z-[52]",
          "w-[90vw] max-w-md",
          "animate-scale-in",
          // Positioning based on placement
          step.placement === "center" && "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
          step.placement === "top" &&
            highlightRect &&
            `top-[${highlightRect.top - 320}px] left-[${highlightRect.left}px]`,
          step.placement === "bottom" &&
            highlightRect &&
            `top-[${highlightRect.bottom + 16}px] left-[${highlightRect.left}px]`,
          step.placement === "left" &&
            highlightRect &&
            `top-[${highlightRect.top}px] left-[${highlightRect.left - 320}px]`,
          step.placement === "right" &&
            highlightRect &&
            `top-[${highlightRect.top}px] left-[${highlightRect.right + 16}px]`,
          !step.placement && "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        )}
      >
        <Card className="shadow-2xl border-2 border-dental-primary/20">
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-xl">{step.title}</CardTitle>
              {showSkip && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSkip}
                  className="h-6 w-6"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Skip tour</span>
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {step.image && (
              <div className="flex justify-center">{step.image}</div>
            )}

            <p className="text-muted-foreground">{step.content}</p>

            {/* Progress indicator */}
            <div className="flex items-center gap-1.5">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "h-1.5 rounded-full flex-1 transition-all",
                    index === currentStep
                      ? "bg-dental-primary"
                      : index < currentStep
                      ? "bg-dental-primary/50"
                      : "bg-gray-200"
                  )}
                />
              ))}
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={isFirstStep}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <Button onClick={handleNext}>
              {isLastStep ? (
                "Complete"
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  )
}

/**
 * Hook to manage tour state
 */
export function useFeatureTour(tourKey: string) {
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    const hasSeenTour = localStorage.getItem(`tour_${tourKey}_completed`)
    if (!hasSeenTour) {
      setIsOpen(true)
    }
  }, [tourKey])

  const completeTour = () => {
    localStorage.setItem(`tour_${tourKey}_completed`, "true")
    setIsOpen(false)
  }

  const skipTour = () => {
    localStorage.setItem(`tour_${tourKey}_completed`, "true")
    setIsOpen(false)
  }

  const resetTour = () => {
    localStorage.removeItem(`tour_${tourKey}_completed`)
    setIsOpen(true)
  }

  return {
    isOpen,
    completeTour,
    skipTour,
    resetTour,
  }
}
