import React, { useState, useEffect, useCallback, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { PatientDashboard } from "./PatientDashboard";
import { AiOptOutPrompt } from "./AiOptOutPrompt";
import { ModernLoadingSpinner } from "@/components/enhanced/ModernLoadingSpinner";
import { useUserRole } from "@/hooks/useUserRole";

interface UnifiedDashboardProps {
  user: User;
}

export const UnifiedDashboard = memo(({ user }: UnifiedDashboardProps) => {
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const navigate = useNavigate();
  const { isDentist, isAdmin, loading: roleLoading } = useUserRole();

  useEffect(() => {
    const checkDentistRedirect = async () => {
      if (roleLoading) return;

      const selectedClinicDentistId = sessionStorage.getItem('selectedClinicDentistId');
      const selectedClinicSlug = sessionStorage.getItem('selectedClinicSlug');
      const selectedClinicName = sessionStorage.getItem('selectedClinicName');
      const accessMode = sessionStorage.getItem('accessMode');

      console.log('UnifiedDashboard - Session data:', {
        selectedClinicDentistId,
        selectedClinicSlug,
        selectedClinicName,
        accessMode,
        isDentist,
        isAdmin
      });

      // If a clinic was selected, check the access mode
      if (selectedClinicDentistId && accessMode) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile) {
          const { data: dentistData } = await supabase
            .from('dentists')
            .select('id, is_active')
            .eq('profile_id', profile.id)
            .maybeSingle();

          // Check if user owns this clinic
          const ownsClinic = dentistData?.id === selectedClinicDentistId;

          if (accessMode === 'admin' && ownsClinic && (dentistData?.is_active || isAdmin)) {
            // Admin access to own clinic - redirect to dentist portal
            console.log('Redirecting to dentist portal (admin mode)');
            sessionStorage.removeItem('selectedClinicDentistId');
            sessionStorage.removeItem('selectedClinicSlug');
            sessionStorage.removeItem('selectedClinicName');
            sessionStorage.removeItem('accessMode');
            setShouldRedirect(true);
            navigate('/dentist/clinical/dashboard', { replace: true });
            return;
          } else if (accessMode === 'patient') {
            // Patient access - stay on patient dashboard
            console.log('Accessing clinic as patient');
            // Clear the dentist ID but keep slug for appointment booking
            sessionStorage.removeItem('selectedClinicDentistId');
            sessionStorage.removeItem('accessMode');
            // Keep selectedClinicSlug and selectedClinicName for appointment booking context
          }
        }
      }

      // If no clinic selected, redirect dentists/admins to their portal by default
      if (!selectedClinicSlug && !accessMode && (isDentist || isAdmin)) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile) {
          const { data: dentistData } = await supabase
            .from('dentists')
            .select('id, is_active')
            .eq('profile_id', profile.id)
            .maybeSingle();

          if (dentistData?.is_active || isAdmin) {
            console.log('No clinic selected - redirecting dentist/admin to their portal');
            setShouldRedirect(true);
            navigate('/dentist/clinical/dashboard', { replace: true });
            return;
          }
        }
      }
    };

    checkDentistRedirect();
  }, [user.id, navigate, isDentist, isAdmin, roleLoading]);

  if (roleLoading || shouldRedirect) {
    return (
      <ModernLoadingSpinner 
        variant="overlay" 
        size="lg"
        message="Loading Dashboard" 
        description="Setting up your personalized experience..." 
      />
    );
  }

  // Show patient dashboard for patients and those without dentist role
  return (
    <>
      <PatientDashboard user={user} />
      <AiOptOutPrompt user={user} />
    </>
  );
});

UnifiedDashboard.displayName = 'UnifiedDashboard';

export default UnifiedDashboard;