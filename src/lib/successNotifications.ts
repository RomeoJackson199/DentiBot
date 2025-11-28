import { toast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Calendar, Save } from "lucide-react";

export const showSuccessBanner = (message: string, description?: string) => {
  toast({
    title: message,
    description,
    className: "bg-green-50 border-green-200 text-green-900",
    duration: 4000,
  });
};

export const showAppointmentConfirmed = (date?: string) => {
  toast({
    title: "✅ Appointment confirmed!",
    description: date ? `Scheduled for ${date}` : "Your appointment has been successfully booked",
    className: "bg-green-50 border-green-200 text-green-900",
    duration: 5000,
  });
};

export const showAppointmentCancelled = () => {
  toast({
    title: "Appointment cancelled",
    description: "The appointment has been cancelled successfully",
    className: "bg-orange-50 border-orange-200 text-orange-900",
    duration: 4000,
  });
};

export const showAppointmentRescheduled = (newDate?: string) => {
  toast({
    title: "✅ Appointment rescheduled",
    description: newDate ? `Moved to ${newDate}` : "Your appointment has been rescheduled",
    className: "bg-blue-50 border-blue-200 text-blue-900",
    duration: 4000,
  });
};

export const showSavedSuccessfully = (itemName?: string) => {
  toast({
    title: "✅ Saved successfully",
    description: itemName ? `${itemName} has been saved` : "Your changes have been saved",
    className: "bg-green-50 border-green-200 text-green-900",
    duration: 3000,
  });
};

export const showErrorBanner = (message: string, description?: string) => {
  toast({
    title: message,
    description,
    variant: "destructive",
    duration: 5000,
  });
};
