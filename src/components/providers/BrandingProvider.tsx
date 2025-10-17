import { useEffect } from 'react';
import { useClinicBranding } from '@/hooks/useClinicBranding';

interface BrandingProviderProps {
  children: React.ReactNode;
  dentistId?: string | null;
}

// Helper to convert hex to HSL
function hexToHSL(hex: string): string {
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
  
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  
  return `${h} ${s}% ${l}%`;
}

export function BrandingProvider({ children, dentistId }: BrandingProviderProps) {
  const { branding, loading } = useClinicBranding(dentistId);

  useEffect(() => {
    // Only apply branding if dentistId is provided (context-specific branding)
    if (!dentistId || loading) return;

    const root = document.documentElement;
    
    // Apply primary color
    if (branding.primaryColor) {
      const primaryHSL = hexToHSL(branding.primaryColor);
      root.style.setProperty('--primary', primaryHSL);
      
      // Create lighter and darker variants
      const [h, s, l] = primaryHSL.split(' ');
      const lValue = parseInt(l);
      root.style.setProperty('--primary-light', `${h} ${s} ${Math.min(lValue + 10, 95)}%`);
      root.style.setProperty('--primary-dark', `${h} ${s} ${Math.max(lValue - 10, 5)}%`);
    }
    
    // Apply secondary color
    if (branding.secondaryColor) {
      const secondaryHSL = hexToHSL(branding.secondaryColor);
      root.style.setProperty('--secondary', secondaryHSL);
      
      // Create lighter and darker variants
      const [h, s, l] = secondaryHSL.split(' ');
      const lValue = parseInt(l);
      root.style.setProperty('--secondary-light', `${h} ${s} ${Math.min(lValue + 10, 95)}%`);
      root.style.setProperty('--secondary-dark', `${h} ${s} ${Math.max(lValue - 10, 5)}%`);
    }
    
    // Update sidebar colors to match primary
    if (branding.primaryColor) {
      const primaryHSL = hexToHSL(branding.primaryColor);
      root.style.setProperty('--sidebar-primary', primaryHSL);
    }
    
    console.log('Applied branding:', {
      clinicName: branding.clinicName,
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
      specialty: branding.specialtyType
    });
  }, [branding, loading]);

  return <>{children}</>;
}
