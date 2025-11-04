import { useState, useEffect } from "react";
import { Monitor, Tablet, Smartphone } from "lucide-react";

export const ScreenSizeIndicator = () => {
  const [screenType, setScreenType] = useState<"mobile" | "tablet" | "desktop">("desktop");

  useEffect(() => {
    const updateScreenType = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenType("mobile");
      } else if (width >= 768 && width < 1024) {
        setScreenType("tablet");
      } else {
        setScreenType("desktop");
      }
    };

    // Initial check
    updateScreenType();

    // Add resize listener
    window.addEventListener("resize", updateScreenType);

    return () => window.removeEventListener("resize", updateScreenType);
  }, []);

  const getIcon = () => {
    switch (screenType) {
      case "mobile":
        return <Smartphone className="h-4 w-4" />;
      case "tablet":
        return <Tablet className="h-4 w-4" />;
      case "desktop":
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getLabel = () => {
    switch (screenType) {
      case "mobile":
        return "Mobile View";
      case "tablet":
        return "Tablet View";
      case "desktop":
        return "Desktop View";
    }
  };

  const getColor = () => {
    switch (screenType) {
      case "mobile":
        return "bg-green-100 text-green-700 border-green-300";
      case "tablet":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "desktop":
        return "bg-purple-100 text-purple-700 border-purple-300";
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-full border-2 shadow-lg flex items-center gap-2 text-sm font-medium ${getColor()} backdrop-blur-sm transition-all`}>
      {getIcon()}
      <span>{getLabel()}</span>
    </div>
  );
};
