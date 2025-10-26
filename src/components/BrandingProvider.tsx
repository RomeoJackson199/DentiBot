import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BrandingProviderProps {
  children: React.ReactNode;
  businessId?: string;
}

export const BrandingProvider = ({ children, businessId }: BrandingProviderProps) => {
  const [colors, setColors] = useState({ primary: '#0F3D91', secondary: '#66D2D6' });

  useEffect(() => {
    if (!businessId) return;

    const fetchBranding = async () => {
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('primary_color, secondary_color')
          .eq('id', businessId)
          .single();

        if (error) throw error;

        if (data) {
          setColors({
            primary: data.primary_color || '#0F3D91',
            secondary: data.secondary_color || '#66D2D6',
          });
        }
      } catch (error) {
        console.error('Error fetching branding:', error);
      }
    };

    fetchBranding();
  }, [businessId]);

  useEffect(() => {
    const applyBranding = () => {
      const { primary, secondary } = colors;

      if (!primary || !secondary) return;

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
      
      const primaryHSL = hexToHSL(primary);
      const secondaryHSL = hexToHSL(secondary);

      root.style.setProperty('--dental-primary', primaryHSL);
      root.style.setProperty('--primary', primaryHSL);
      root.style.setProperty('--dental-accent', secondaryHSL);
      root.style.setProperty('--secondary', secondaryHSL);
    };

    applyBranding();
  }, [colors]);

  return <>{children}</>;
}