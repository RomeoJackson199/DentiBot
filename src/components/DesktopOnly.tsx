import { Monitor } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface DesktopOnlyProps {
  children: ReactNode;
}

export function DesktopOnly({ children }: DesktopOnlyProps) {
  const [width, setWidth] = useState(window.innerWidth);
  const [forceDesktop, setForceDesktop] = useState(false);

  useEffect(() => {
    // Check for override via query param or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const forceParam = urlParams.get('forceDesktop') === '1';
    const forceLocal = localStorage.getItem('forceDesktop') === '1';
    
    if (forceParam && !forceLocal) {
      localStorage.setItem('forceDesktop', '1');
    }
    
    setForceDesktop(forceParam || forceLocal);

    // Track window width
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleShowAnyway = () => {
    localStorage.setItem('forceDesktop', '1');
    window.location.reload();
  };

  const minWidth = 768;
  const shouldShowGate = width < minWidth && !forceDesktop;

  if (!shouldShowGate) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md text-center space-y-6">
        <Monitor className="h-16 w-16 mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-semibold text-foreground">Desktop Only</h1>
        <div className="space-y-2">
          <p className="text-muted-foreground">
            This application is optimized for laptop and desktop screens.
          </p>
          <div className="text-sm font-mono bg-muted/50 p-2 rounded">
            Current width: <span className="font-semibold">{width}px</span> / Minimum: <span className="font-semibold">{minWidth}px</span>
          </div>
          <p className="text-xs text-muted-foreground">
            If you're in the builder, switch the preview to Desktop or widen the preview area.
          </p>
        </div>
        <Button onClick={handleShowAnyway} variant="outline" size="sm">
          Show Anyway
        </Button>
      </div>
    </div>
  );
}
