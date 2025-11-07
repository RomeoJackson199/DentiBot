import { Monitor } from "lucide-react";
import { ReactNode } from "react";

interface DesktopOnlyProps {
  children: ReactNode;
}

export function DesktopOnly({ children }: DesktopOnlyProps) {
  return (
    <>
      {/* Show message on screens smaller than laptop (< 768px) */}
      <div className="md:hidden min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="max-w-md text-center space-y-4">
          <Monitor className="h-16 w-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-semibold text-foreground">Desktop Only</h1>
          <p className="text-muted-foreground">
            This application is optimized for laptop and desktop screens.
            Please access it from a larger device for the best experience.
          </p>
        </div>
      </div>

      {/* Show actual content on laptop and larger screens */}
      <div className="hidden md:block">
        {children}
      </div>
    </>
  );
}
