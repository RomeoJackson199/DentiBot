/**
 * Caberu Logo Component
 * Professional logo with multiple size variants
 * Logos are served from Supabase public storage
 */

import { getCaberuLogo } from "@/lib/caberu-branding";

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
  const logoSrc = getCaberuLogo(variant);

  return (
    <img
      src={logoSrc}
      alt={variant === "full" ? "Caberu Healthcare Solutions" : "Caberu"}
      style={{ height: logoSize }}
      className={`object-contain ${className}`}
    />
  );
}

/**
 * Animated Logo for splash screens and loading states
 */
export function AnimatedLogo({ size = "lg", variant = "full" }: { size?: "sm" | "md" | "lg" | "xl"; variant?: "full" | "icon" }) {
  const logoSize = sizeMap[size];
  const logoSrc = getCaberuLogo(variant);

  return (
    <div className="flex flex-col items-center gap-4 animate-pulse">
      <img
        src={logoSrc}
        alt={variant === "full" ? "Caberu Healthcare Solutions" : "Caberu"}
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
  const logoSrc = getCaberuLogo("icon");

  return (
    <img
      src={logoSrc}
      alt="Caberu Icon"
      width="32"
      height="32"
      className="object-contain"
    />
  );
}
