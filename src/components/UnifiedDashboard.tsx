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

      // Check if coming from clinic selector
      const selectedClinicDentistId = sessionStorage.getItem('selectedClinicDentistId');
      const selectedClinicSlug = sessionStorage.getItem('selectedClinicSlug');

      // Dentists and admins should be redirected to dentist portal
      if (isDentist || isAdmin) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile) {
          const { data: dentistData } = await supabase
            .from('dentists')
            .select('is_active')
            .eq('profile_id', profile.id)
            .maybeSingle();

          if (dentistData?.is_active || isAdmin) {
            console.log('Active dentist/admin detected, redirecting to dentist portal');
            setShouldRedirect(true);
            navigate('/dentist/clinical/dashboard', { replace: true });
            return;
          }
        }
      }

      // If patient selected a clinic, store it for appointment booking
      if (selectedClinicSlug && !isDentist && !isAdmin) {
        console.log('Patient selected clinic:', selectedClinicSlug);
        // Keep the clinic selection in sessionStorage for appointment booking
        // It will be used by appointment booking components
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