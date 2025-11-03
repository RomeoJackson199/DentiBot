import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BookingReadyWidgetProps {
  conversationData: {
    symptoms?: string;
    urgency?: number;
    messages: any[];
  };
}

export const BookingReadyWidget = ({ conversationData }: BookingReadyWidgetProps) => {
  const navigate = useNavigate();

  const handleProceed = () => {
    // Store conversation data in session storage for the booking page
    sessionStorage.setItem('aiBookingData', JSON.stringify(conversationData));
    navigate('/book-appointment-ai');
  };

  return (
    <Card className="max-w-md mx-auto my-4 border-primary/20 shadow-lg bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Ready to Book</h3>
              <p className="text-sm text-muted-foreground">
                I have all the information I need!
              </p>
            </div>
          </div>

          <div className="bg-background/50 rounded-lg p-4 space-y-2 text-sm">
            <p className="text-muted-foreground">
              Based on our conversation, I can now help you find the perfect dentist and book your appointment.
            </p>
          </div>

          <Button 
            onClick={handleProceed}
            className="w-full group"
            size="lg"
          >
            Proceed to Book Appointment
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
