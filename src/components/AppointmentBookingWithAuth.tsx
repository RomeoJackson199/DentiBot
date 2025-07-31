import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { AuthForm } from "./AuthForm";
import { AppointmentBooking } from "./AppointmentBooking";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, ArrowLeft } from "lucide-react";

interface AppointmentBookingWithAuthProps {
  user: User | null;
  selectedDentist?: any;
  prefilledReason?: string;
  onComplete: (appointmentData?: any) => void;
  onCancel: () => void;
}

export const AppointmentBookingWithAuth = ({ 
  user, 
  selectedDentist, 
  prefilledReason, 
  onComplete, 
  onCancel 
}: AppointmentBookingWithAuthProps) => {
  const [showAuthStep, setShowAuthStep] = useState(false);
  const [selectedBookingData, setSelectedBookingData] = useState<any>(null);

  // If user is already authenticated, show booking directly
  if (user) {
    return (
      <AppointmentBooking
        user={user}
        selectedDentist={selectedDentist}
        prefilledReason={prefilledReason}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    );
  }

  const handleProceedToBooking = (bookingData: any) => {
    setSelectedBookingData(bookingData);
    setShowAuthStep(true);
  };

  if (showAuthStep) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto">
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAuthStep(false)}
                  className="p-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="flex items-center text-lg font-bold text-gray-800">
                  <CalendarDays className="h-5 w-5 mr-2 text-blue-600" />
                  Sign in to book
                </CardTitle>
                <div></div>
              </div>
              <p className="text-gray-600 text-sm mt-2">
                Please sign in or create an account to confirm your appointment
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <AuthForm />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <AppointmentSelection onProceed={handleProceedToBooking} onCancel={onCancel} />;
};

// Component for selecting appointment details without authentication
const AppointmentSelection = ({ 
  onProceed, 
  onCancel 
}: { 
  onProceed: (data: any) => void; 
  onCancel: () => void; 
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="flex items-center justify-center text-2xl font-bold text-gray-800">
              <CalendarDays className="h-6 w-6 mr-3 text-blue-600" />
              Book Appointment
            </CardTitle>
            <p className="text-gray-600 mt-2">Select your preferred date and time</p>
          </CardHeader>
          <CardContent className="p-8">
            <div className="text-center py-12">
              <p className="text-lg text-gray-700 mb-6">
                Appointment booking functionality will be integrated here.
              </p>
              <p className="text-sm text-gray-500 mb-8">
                After selecting your appointment details, you'll be asked to sign in to confirm the booking.
              </p>
              <div className="flex justify-center space-x-4">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="px-6 py-2"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => onProceed({ demo: true })}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700"
                >
                  Continue to Sign In
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
