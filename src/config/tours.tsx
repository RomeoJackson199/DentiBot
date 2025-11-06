/**
 * Predefined onboarding tours for different user roles
 */

import { TourStep } from "@/components/ui/feature-tour"
import { Calendar, Bot, FileText, CreditCard, MessageSquare, Settings } from "lucide-react"

/**
 * Patient onboarding tour
 */
export const patientTourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Caberu! 🎉",
    content:
      "Your personal healthcare companion. Let's take a quick tour of the features available to you.",
    placement: "center",
    image: <Bot className="h-16 w-16 text-dental-primary mx-auto animate-bounce-gentle" />,
  },
  {
    id: "ai-assistant",
    title: "AI Assistant",
    content:
      "Get instant help booking appointments. Just describe what you need, and our AI will guide you through the process.",
    target: '[data-tour="ai-assistant"]',
    placement: "bottom",
    image: <Bot className="h-12 w-12 text-emerald-600" />,
  },
  {
    id: "appointments",
    title: "Your Appointments",
    content:
      "View all your upcoming and past appointments. You can reschedule or cancel if needed.",
    target: '[data-tour="appointments"]',
    placement: "bottom",
    image: <Calendar className="h-12 w-12 text-orange-600" />,
  },
  {
    id: "medical-records",
    title: "Medical Records",
    content:
      "Access your medical history, treatment plans, and prescriptions all in one secure place.",
    target: '[data-tour="medical-records"]',
    placement: "bottom",
    image: <FileText className="h-12 w-12 text-purple-600" />,
  },
  {
    id: "payments",
    title: "Payments",
    content:
      "View and pay your bills securely. We'll send you reminders so you never miss a payment.",
    target: '[data-tour="payments"]',
    placement: "bottom",
    image: <CreditCard className="h-12 w-12 text-green-600" />,
  },
  {
    id: "messages",
    title: "Messages",
    content:
      "Communicate directly with your healthcare provider. Ask questions and get updates.",
    target: '[data-tour="messages"]',
    placement: "bottom",
    image: <MessageSquare className="h-12 w-12 text-indigo-600" />,
  },
  {
    id: "complete",
    title: "You're All Set! ✨",
    content:
      "You're ready to start using Caberu. Book your first appointment or explore the features at your own pace.",
    placement: "center",
  },
]

/**
 * Provider onboarding tour
 */
export const providerTourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome, Doctor! 👨‍⚕️",
    content:
      "Let's walk through your new practice management dashboard and its powerful features.",
    placement: "center",
    image: <Calendar className="h-16 w-16 text-dental-primary mx-auto animate-bounce-gentle" />,
  },
  {
    id: "dashboard",
    title: "Dashboard Overview",
    content:
      "Your command center. See today's appointments, patient statistics, and quick actions all in one place.",
    target: '[data-tour="dashboard"]',
    placement: "center",
  },
  {
    id: "appointments",
    title: "Appointment Management",
    content:
      "View, edit, and manage all appointments. Our AI helps optimize your schedule by balancing time slots.",
    target: '[data-tour="appointments-manager"]',
    placement: "bottom",
    image: <Calendar className="h-12 w-12 text-orange-600" />,
  },
  {
    id: "patient-records",
    title: "Patient Records",
    content:
      "Access comprehensive patient histories, add notes, and update treatment plans with ease.",
    target: '[data-tour="patient-records"]',
    placement: "bottom",
    image: <FileText className="h-12 w-12 text-purple-600" />,
  },
  {
    id: "ai-features",
    title: "AI-Powered Insights",
    content:
      "Get AI-generated appointment summaries, slot recommendations, and patient intake analysis to save time.",
    target: '[data-tour="ai-features"]',
    placement: "bottom",
    image: <Bot className="h-12 w-12 text-emerald-600" />,
  },
  {
    id: "billing",
    title: "Payment Management",
    content:
      "Create invoices, track payments, and send automated reminders. All integrated with Stripe.",
    target: '[data-tour="billing"]',
    placement: "bottom",
    image: <CreditCard className="h-12 w-12 text-green-600" />,
  },
  {
    id: "settings",
    title: "Practice Settings",
    content:
      "Customize your clinic branding, manage staff, set working hours, and configure appointment types.",
    target: '[data-tour="settings"]',
    placement: "left",
    image: <Settings className="h-12 w-12 text-gray-600" />,
  },
  {
    id: "complete",
    title: "Ready to Go! 🚀",
    content:
      "Your practice is set up and ready. Start accepting appointments and let Caberu handle the rest!",
    placement: "center",
  },
]

/**
 * Booking flow tour (for first-time bookers)
 */
export const bookingTourSteps: TourStep[] = [
  {
    id: "start",
    title: "Book Your Appointment",
    content:
      "Let's walk through the booking process. It only takes a minute!",
    placement: "center",
  },
  {
    id: "service",
    title: "Choose Your Service",
    content:
      "Select the type of appointment you need. Each service shows the duration and cost.",
    target: '[data-tour="service-selector"]',
    placement: "top",
  },
  {
    id: "provider",
    title: "Select Your Provider",
    content:
      "Choose your preferred healthcare provider. You can see their specialization and bio.",
    target: '[data-tour="provider-selector"]',
    placement: "top",
  },
  {
    id: "date-time",
    title: "Pick Date & Time",
    content:
      "Our AI recommends the best available slots based on your preferences and practice schedules.",
    target: '[data-tour="datetime-selector"]',
    placement: "top",
  },
  {
    id: "ai-recommendations",
    title: "AI Recommendations",
    content:
      "Slots marked with ✨ are AI-recommended. They help balance the schedule and often have better availability.",
    target: '[data-tour="ai-badge"]',
    placement: "bottom",
  },
  {
    id: "confirm",
    title: "Confirm & Book",
    content:
      "Review your booking details and confirm. You'll receive email and SMS reminders.",
    target: '[data-tour="confirm-button"]',
    placement: "top",
  },
]

/**
 * Helper to add tour target attributes to elements
 *
 * Usage:
 * <Button {...tourTarget("booking-button")}>Book Now</Button>
 */
export const tourTarget = (id: string) => ({
  "data-tour": id,
})

/**
 * Example usage in components:
 *
 * import { patientTourSteps, tourTarget } from "@/config/tours"
 * import { FeatureTour, useFeatureTour } from "@/components/ui/feature-tour"
 *
 * function PatientPortal() {
 *   const { isOpen, completeTour, skipTour } = useFeatureTour("patient-onboarding")
 *
 *   return (
 *     <>
 *       <Button {...tourTarget("ai-assistant")}>AI Assistant</Button>
 *       <Button {...tourTarget("appointments")}>Appointments</Button>
 *
 *       <FeatureTour
 *         steps={patientTourSteps}
 *         isOpen={isOpen}
 *         onComplete={completeTour}
 *         onSkip={skipTour}
 *       />
 *     </>
 *   )
 * }
 */
