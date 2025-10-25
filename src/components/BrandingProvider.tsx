import { useEffect } from "react";
import { useClinicBranding } from "@/hooks/useClinicBranding";

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { branding } = useClinicBranding();

  useEffect(() => {
    if (branding.primaryColor || branding.secondaryColor) {
      // Convert hex to HSL
      const hexToHSL = (hex: string) => {
        // Remove # if present
        hex = hex.replace('#', '');
        
        // Convert to RGB
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;
        
        if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          
          switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
          }
        }
        
        return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
      };

      const root = document.documentElement;
      
      if (branding.primaryColor) {
        const primaryHSL = hexToHSL(branding.primaryColor);
        root.style.setProperty('--dental-primary', primaryHSL);
        root.style.setProperty('--primary', primaryHSL);
      }
      
      if (branding.secondaryColor) {
        const secondaryHSL = hexToHSL(branding.secondaryColor);
        root.style.setProperty('--dental-accent', secondaryHSL);
        root.style.setProperty('--secondary', secondaryHSL);
      }
    }
  }, [branding.primaryColor, branding.secondaryColor]);

  return <>{children}</>;
}
