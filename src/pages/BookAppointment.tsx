import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calendar } from "lucide-react";

export default function BookAppointment() {
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenBooking = () => {
    setIsLoading(true);
    // Open in new tab
    window.open('https://caberu.be/book-appointment', '_blank');
    // Reset loading state after a brief delay
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="h-full w-full p-4 md:p-6">
      <Card className="h-full flex flex-col items-center justify-center max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Book Your Appointment</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Ready to schedule your appointment? Click below to access our booking system.
          </p>
          <Button 
            onClick={handleOpenBooking}
            disabled={isLoading}
            size="lg"
            className="w-full"
          >
            {isLoading ? (
              "Opening Booking..."
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Booking System
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            This will open in a new tab while keeping your dashboard accessible.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
