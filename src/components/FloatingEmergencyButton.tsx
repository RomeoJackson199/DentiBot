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
      
    </div>;
};