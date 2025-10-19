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
  const { isDentist, isAdmin, isPatient, loading: roleLoading } = useUserRole();

  useEffect(() => {
    const checkRoleBasedRedirect = async () => {
      if (roleLoading) return;

      // Dentists/providers and admins should be redirected to dentist portal
      if (isDentist || isAdmin) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile) {
          const { data: providerData } = await supabase
            .from('providers')
            .select('is_active')
            .eq('profile_id', profile.id)
            .maybeSingle();

          if (providerData?.is_active || isAdmin) {
            console.log('Active provider/admin detected, redirecting to dentist portal');
            setShouldRedirect(true);
            navigate('/dentist/clinical/dashboard', { replace: true });
            return;
          }
        }
      }

      // Patients should go to patient dashboard
      if (isPatient) {
        console.log('Patient detected, showing patient dashboard');
        setShouldRedirect(false);
      }
    };

    checkRoleBasedRedirect();
  }, [user.id, navigate, isDentist, isAdmin, isPatient, roleLoading]);

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

  // Show patient dashboard for patients and those without provider role
  return (
    <>
      <PatientDashboard user={user} />
      <AiOptOutPrompt user={user} />
    </>
  );
});

UnifiedDashboard.displayName = 'UnifiedDashboard';

export default UnifiedDashboard;