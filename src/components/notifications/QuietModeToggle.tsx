import { Switch } from "@/components/ui/switch";
import { BellOff, Bell } from "lucide-react";
import { useState, useEffect } from "react";

interface QuietModeToggleProps {
  className?: string;
}

export const QuietModeToggle = ({ className }: QuietModeToggleProps) => {
  const [isQuietMode, setIsQuietMode] = useState(() => {
    try {
      return localStorage.getItem('quiet-mode') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('quiet-mode', isQuietMode.toString());
    } catch {
      // Handle localStorage errors silently
    }
  }, [isQuietMode]);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {isQuietMode ? <BellOff className="h-4 w-4 text-muted-foreground" /> : <Bell className="h-4 w-4 text-primary" />}
      <span className="text-sm font-medium">Quiet mode</span>
      <Switch
        checked={isQuietMode}
        onCheckedChange={setIsQuietMode}
        aria-label="Toggle notification quiet mode"
      />
    </div>
  );
};