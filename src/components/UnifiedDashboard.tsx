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
  const { isDentist, isAdmin, isPatient, roles, loading: roleLoading } = useUserRole();

  useEffect(() => {
    if (roleLoading) return;

    console.log('UnifiedDashboard: Checking roles', { isDentist, isAdmin, isPatient, roles: JSON.stringify(roles) });

    // Dentists/providers and admins redirect to dentist portal
    if (isDentist || isAdmin) {
      console.log('✓ Redirecting to dentist portal');
      setShouldRedirect(true);
      navigate('/dentist/clinical/dashboard', { replace: true });
      return;
    }

    // Patients stay on patient dashboard
    if (isPatient) {
      console.log('✓ Showing patient dashboard');
      setShouldRedirect(false);
      return;
    }

    // No role detected - show patient dashboard as fallback
    console.warn('⚠ No role detected, defaulting to patient dashboard');
    setShouldRedirect(false);
  }, [roleLoading, isDentist, isAdmin, isPatient, navigate]);

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