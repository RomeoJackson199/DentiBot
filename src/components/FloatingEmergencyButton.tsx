import { Button } from "@/components/ui/button";
import { AlertTriangle, Phone } from "lucide-react";
import { useState } from "react";
interface FloatingEmergencyButtonProps {
  onEmergencyClick: () => void;
}
export const FloatingEmergencyButton = ({
  onEmergencyClick
}: FloatingEmergencyButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  return <div className="fixed bottom-6 right-6 z-50">
      {/* Tooltip */}
      {isHovered && <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-black/80 text-white text-sm rounded-lg whitespace-nowrap animate-fade-in">
          Emergency Triage
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/80"></div>
        </div>}

      {/* Pulse Ring */}
      <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></div>

      {/* Emergency Button */}
      <Button
        onClick={onEmergencyClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        size="lg"
        className="relative rounded-full w-16 h-16 bg-red-600 hover:bg-red-700 text-white shadow-2xl hover:shadow-red-500/50 transition-all duration-300"
        aria-label="Emergency Triage"
      >
        <AlertTriangle className="h-7 w-7" />
      </Button>
    </div>;
};