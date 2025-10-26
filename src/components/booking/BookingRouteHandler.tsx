import { Navigate } from 'react-router-dom';
import { useBusinessTemplate } from '@/hooks/useBusinessTemplate';

interface BookingRouteHandlerProps {
  children: React.ReactNode;
}

export function BookingRouteHandler({ children }: BookingRouteHandlerProps) {
  const { hasFeature, loading } = useBusinessTemplate();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // If AI chat is disabled, redirect to manual booking
  if (!hasFeature('aiChat')) {
    return <Navigate to="/book-manual" replace />;
  }

  return <>{children}</>;
}
