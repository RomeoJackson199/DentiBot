/**
 * Lazy-loaded components for code splitting
 * Reduces initial bundle size and improves performance
 *
 * Usage:
 * import { LazyDentistPortal } from '@/components/LazyComponents'
 *
 * <Suspense fallback={<LoadingSpinner />}>
 *   <LazyDentistPortal />
 * </Suspense>
 */

import { lazy } from "react"

// === PATIENT PORTAL ===

export const LazyPatientPortal = lazy(() =>
  import("@/pages/Index").then((module) => ({ default: module.default }))
)

export const LazyBookAppointment = lazy(() =>
  import("@/pages/BookAppointment").then((module) => ({
    default: module.default,
  }))
)

export const LazyBookAppointmentAI = lazy(() =>
  import("@/pages/BookAppointmentAI").then((module) => ({
    default: module.default,
  }))
)

// === PROVIDER PORTAL ===

export const LazyDentistPortal = lazy(() =>
  import("@/pages/DentistPortal").then((module) => ({ default: module.default }))
)

export const LazyDentistAppointmentsManagement = lazy(() =>
  import("@/pages/DentistAppointmentsManagement").then((module) => ({
    default: module.default,
  }))
)

export const LazyDentistAdminBranding = lazy(() =>
  import("@/pages/DentistAdminBranding").then((module) => ({
    default: module.default,
  }))
)

export const LazyDentistAdminProfile = lazy(() =>
  import("@/pages/DentistAdminProfile").then((module) => ({
    default: module.default,
  }))
)

export const LazyDentistAdminSecurity = lazy(() =>
  import("@/pages/DentistAdminSecurity").then((module) => ({
    default: module.default,
  }))
)

export const LazyDentistAdminUsers = lazy(() =>
  import("@/pages/DentistAdminUsers").then((module) => ({
    default: module.default,
  }))
)

export const LazyDentistSettings = lazy(() =>
  import("@/pages/DentistSettings").then((module) => ({
    default: module.default,
  }))
)

// === ANALYTICS ===

export const LazyAnalytics = lazy(() =>
  import("@/pages/Analytics").then((module) => ({ default: module.default }))
)

// === CHAT & AI ===

export const LazyChat = lazy(() =>
  import("@/pages/Chat").then((module) => ({ default: module.default }))
)

export const LazyNewInteractiveDentalChat = lazy(() =>
  import("@/components/chat/NewInteractiveDentalChat").then((module) => ({
    default: module.NewInteractiveDentalChat,
  }))
)

// === MEDICAL RECORDS ===

export const LazyEnhancedMedicalRecords = lazy(() =>
  import("@/components/medical/EnhancedMedicalRecords").then((module) => ({
    default: module.EnhancedMedicalRecords,
  }))
)

// === LOADING FALLBACKS ===

import { LoadingSkeleton, AppointmentCardSkeleton } from "@/components/ui/enhanced-loading-states"
import { LoadingIllustration } from "@/components/ui/empty-state-illustrations"
import { Card, CardContent } from "@/components/ui/card"

/**
 * Page-level loading fallback
 */
export const PageLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingIllustration />
  </div>
)

/**
 * Dashboard loading fallback
 */
export const DashboardLoadingFallback = () => (
  <div className="container mx-auto p-6 space-y-6">
    <Card>
      <CardContent className="p-6">
        <LoadingSkeleton lines={4} />
      </CardContent>
    </Card>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <AppointmentCardSkeleton />
      <AppointmentCardSkeleton />
    </div>
  </div>
)

/**
 * Chat loading fallback
 */
export const ChatLoadingFallback = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <LoadingIllustration className="mx-auto mb-4" />
      <p className="text-muted-foreground">Loading chat...</p>
    </div>
  </div>
)
