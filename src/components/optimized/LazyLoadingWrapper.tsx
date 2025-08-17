import React, { Suspense, lazy } from 'react';
import { ModernLoadingSpinner } from '@/components/enhanced/ModernLoadingSpinner';

interface LazyLoadingWrapperProps {
  importFunc: () => Promise<{ default: React.ComponentType<any> }>;
  fallback?: React.ReactNode;
}

export const LazyLoadingWrapper = ({ 
  importFunc, 
  fallback = <ModernLoadingSpinner message="Loading component..." />
}: LazyLoadingWrapperProps) => {
  const LazyComponent = lazy(importFunc);
  
  return (
    <Suspense fallback={fallback}>
      <LazyComponent />
    </Suspense>
  );
};

// Pre-configured lazy components for common use cases
export const LazyPatientDashboard = lazy(() => import('@/components/PatientDashboard').then(module => ({ default: module.PatientDashboard })));
export const LazyDentistDashboard = lazy(() => import('@/pages/DentistDashboard').then(module => ({ default: module.DentistDashboard })));
export const LazyDentalChatbot = lazy(() => import('@/components/DentalChatbot').then(module => ({ default: module.DentalChatbot })));
export const LazyAppointmentBooking = lazy(() => import('@/components/AppointmentBooking').then(module => ({ default: module.AppointmentBooking })));