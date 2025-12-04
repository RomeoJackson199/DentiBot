import { Navigate } from 'react-router-dom';

interface BookingRouteHandlerProps {
  children: React.ReactNode;
}

export function BookingRouteHandler({ children }: BookingRouteHandlerProps) {
  // Booking is now available to all authenticated users
  return <>{children}</>;
}
