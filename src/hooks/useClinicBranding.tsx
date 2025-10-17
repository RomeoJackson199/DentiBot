import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ClinicBranding {
  logoUrl: string | null;
  clinicName: string | null;
  tagline: string | null;
  primaryColor: string;
  secondaryColor: string;
  specialtyType: string;
  aiInstructions: string | null;
  aiTone: string;
  aiResponseLength: string;
  welcomeMessage: string | null;
  showLogoInChat: boolean;
}

export function useClinicBranding(dentistId?: string | null) {
  const [branding, setBranding] = useState<ClinicBranding>({
    logoUrl: null,
    clinicName: null,
    tagline: null,
    primaryColor: "#0F3D91",
    secondaryColor: "#66D2D6",
    specialtyType: 'dentist',
    aiInstructions: null,
    aiTone: 'professional',
    aiResponseLength: 'normal',
    welcomeMessage: null,
    showLogoInChat: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBranding = async () => {
      // Only load branding if dentistId is provided
      if (!dentistId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('clinic_settings')
          .select('logo_url, clinic_name, tagline, primary_color, secondary_color, specialty_type, ai_instructions, ai_tone, ai_response_length, welcome_message, show_logo_in_chat, dentist_id')
          .eq('dentist_id', dentistId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setBranding({
            logoUrl: data.logo_url,
            clinicName: data.clinic_name,
            tagline: data.tagline,
            primaryColor: data.primary_color || "#0F3D91",
            secondaryColor: data.secondary_color || "#66D2D6",
            specialtyType: data.specialty_type || 'dentist',
            aiInstructions: data.ai_instructions,
            aiTone: data.ai_tone || 'professional',
            aiResponseLength: data.ai_response_length || 'normal',
            welcomeMessage: data.welcome_message,
            showLogoInChat: data.show_logo_in_chat ?? true,
          });
        }
      } catch (error) {
        console.error('Error loading branding:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBranding();

    // Only subscribe to real-time updates if dentistId is provided
    if (!dentistId) {
      return;
    }

    const channel = supabase
      .channel('clinic_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clinic_settings',
          filter: `dentist_id=eq.${dentistId}`,
        },
        (payload) => {
          if (payload.new) {
            const newData = payload.new as any;
            // Only update if it matches our dentistId or if we don't have a specific dentist
            if (!dentistId || newData.dentist_id === dentistId) {
              setBranding({
                logoUrl: newData.logo_url,
                clinicName: newData.clinic_name,
                tagline: newData.tagline,
                primaryColor: newData.primary_color || "#0F3D91",
                secondaryColor: newData.secondary_color || "#66D2D6",
                specialtyType: newData.specialty_type || 'dentist',
                aiInstructions: newData.ai_instructions,
                aiTone: newData.ai_tone || 'professional',
                aiResponseLength: newData.ai_response_length || 'normal',
                welcomeMessage: newData.welcome_message,
                showLogoInChat: newData.show_logo_in_chat ?? true,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dentistId]);

  return { branding, loading };
}
