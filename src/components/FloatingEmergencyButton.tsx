import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

interface FloatingEmergencyButtonProps {
  onEmergencyClick: () => void;
}

export const FloatingEmergencyButton = ({
  onEmergencyClick
}: FloatingEmergencyButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="fixed right-6 sm:right-8 z-50 pointer-events-none bottom-safe-6 sm:bottom-safe-8">
      {/* Button */}
      <Button
        variant="gradient"
        size="icon-lg"
        aria-label="Open emergency triage"
        className="rounded-full shadow-glow relative pointer-events-auto touch-target"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onEmergencyClick}
      >
        <span className="absolute inset-0 rounded-full animate-pulse-soft bg-dental-primary/10" aria-hidden="true" />
        <AlertTriangle className="relative z-10" />
      </Button>

      {/* Tooltip */}
      {isHovered && (
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-black/80 text-white text-sm rounded-lg whitespace-nowrap animate-fade-in pointer-events-none">
          Emergency Triage
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/80" />
        </div>
      )}

      {/* Safe area spacer for iOS bottom inset so button never overlaps home bar */}
      <div className="safe-bottom" aria-hidden="true" />
    </div>
  );
};