/**
 * Caberu Logo Component
 * Professional logo with multiple size variants
 */

import caberuLogo from "@/assets/caberu-logo.jpg";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon";
  className?: string;
}

const sizeMap = {
  sm: 80,
  md: 120,
  lg: 160,
  xl: 200,
};

export function Logo({ size = "md", variant = "full", className = "" }: LogoProps) {
  const logoSize = sizeMap[size];

  return (
    <img
      src={caberuLogo}
      alt="Caberu Logo"
      style={{ height: logoSize }}
      className={`object-contain ${className}`}
    />
  );
}

/**
 * Animated Logo for splash screens and loading states
 */
export function AnimatedLogo({ size = "lg" }: { size?: "sm" | "md" | "lg" | "xl" }) {
  const logoSize = sizeMap[size];

  return (
    <div className="flex flex-col items-center gap-4 animate-pulse">
      <img
        src={caberuLogo}
        alt="Caberu Logo"
        style={{ height: logoSize * 1.5 }}
        className="object-contain"
      />
    </div>
  );
}

/**
 * Favicon-ready icon (simplified for small sizes)
 */
export function FaviconIcon() {
  return (
    <img
      src={caberuLogo}
      alt="Caberu Icon"
      width="32"
      height="32"
      className="object-contain"
    />
  );
}
