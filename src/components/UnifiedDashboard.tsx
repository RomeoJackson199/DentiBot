import React, { useState, useEffect, useCallback, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useNavigate, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const { isDentist, isAdmin, isPatient, roles, loading: roleLoading } = useUserRole();

  useEffect(() => {
    const checkRoleBasedRedirect = async () => {
      if (roleLoading) return;

      // Don't redirect if user explicitly navigated to /patient
      if (location.pathname.startsWith('/patient')) {
        console.log('User on /patient route, respecting their choice');
        setShouldRedirect(false);
        return;
      }

      // Check current business membership
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) {
        setShouldRedirect(false);
        return;
      }

      // Get current business from session
      const { data: sessionBusiness } = await supabase
        .from('session_business')
        .select('business_id')
        .eq('user_id', user.id)
        .maybeSingle();

      const currentBusinessId = sessionBusiness?.business_id;

      if (currentBusinessId) {
        // Check if user is a member of this business
        const { data: membership } = await supabase
          .from('business_members')
          .select('role')
          .eq('profile_id', profile.id)
          .eq('business_id', currentBusinessId)
          .maybeSingle();

        if (membership && (isDentist || isAdmin)) {
          // User is a dentist/admin in this business, redirect to clinic dashboard
          console.log('User is a member of this business, redirecting to clinic dashboard');
          setShouldRedirect(true);
          navigate('/dentist/clinical/dashboard', { replace: true });
          return;
        }
      }

      // Default to patient dashboard
      console.log('User is a patient or not a member, showing patient dashboard');
      setShouldRedirect(false);
    };

    checkRoleBasedRedirect();
  }, [user.id, navigate, location.pathname, isDentist, isAdmin, isPatient, roleLoading]);

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