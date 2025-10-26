import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBusinessContext } from "@/hooks/useBusinessContext";
interface ClinicBranding {
  logoUrl: string | null;
  clinicName: string | null;
  tagline: string | null;
  primaryColor: string;
  secondaryColor: string;
}

export function useClinicBranding() {
  const [branding, setBranding] = useState<ClinicBranding>({
    logoUrl: null,
    clinicName: null,
    tagline: null,
    primaryColor: "#0F3D91",
    secondaryColor: "#66D2D6",
  });
  const [loading, setLoading] = useState(true);
  const { businessId } = useBusinessContext();

  useEffect(() => {
    const loadBranding = async () => {
      if (!businessId) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('logo_url, name, tagline, primary_color, secondary_color')
          .eq('id', businessId)
          .single();

        if (error) throw error;

        if (data) {
          setBranding({
            logoUrl: data.logo_url,
            clinicName: data.name,
            tagline: data.tagline,
            primaryColor: data.primary_color || "#0F3D91",
            secondaryColor: data.secondary_color || "#66D2D6",
          });
        }
      } catch (error) {
        console.error('Error loading branding:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBranding();

    const channel = businessId
      ? supabase
          .channel('businesses_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'businesses',
              filter: `id=eq.${businessId}`,
            },
            (payload) => {
              if (payload.new) {
                const newData = payload.new as any;
                setBranding({
                  logoUrl: newData.logo_url,
                  clinicName: newData.name,
                  tagline: newData.tagline,
                  primaryColor: newData.primary_color || "#0F3D91",
                  secondaryColor: newData.secondary_color || "#66D2D6",
                });
              }
            }
          )
          .subscribe()
      : null;

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [businessId]);

  return { branding, loading };
}
