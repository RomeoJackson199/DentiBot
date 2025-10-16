import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface FloatingBookingButtonProps {
  onBookAppointment: () => void;
  className?: string;
}

export const FloatingBookingButton = ({
  onBookAppointment,
  className
}: FloatingBookingButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className={cn("fixed bottom-20 right-4 z-50 md:hidden", className)}>
      {/* Tooltip */}
      {isHovered && (
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-black/90 text-white text-sm rounded-lg whitespace-nowrap animate-fade-in">
          Book Appointment
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
        </div>
      )}
      
      {/* Pulse Ring - Blue accent */}
      <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
      
      {/* Main Button - Distinct blue accent */}
      <Button
        onClick={onBookAppointment}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        size="icon"
        className="touch-target bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/50 hover:scale-105 active:scale-95 rounded-full h-14 w-14"
        aria-label="Book appointment"
      >
        <Calendar className="h-6 w-6" />
      </Button>
    </div>
  );
};