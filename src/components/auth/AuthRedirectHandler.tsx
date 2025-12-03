import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsSuperAdmin } from '@/hooks/useSuperAdmin';
import { useUserRole } from '@/hooks/useUserRole';
import { useBusinessContext } from '@/hooks/useBusinessContext';
import { ModernLoadingSpinner } from '@/components/enhanced/ModernLoadingSpinner';
import { supabase } from "@/integrations/supabase/client";

export function AuthRedirectHandler() {
  const navigate = useNavigate();
  const { data: isSuperAdmin, isLoading: superAdminLoading } = useIsSuperAdmin();
  const { loading: roleLoading, isDentist } = useUserRole();
  const { loading: businessLoading, businessId, memberships } = useBusinessContext();

  useEffect(() => {
    // Wait for all checks to complete
    if (superAdminLoading || roleLoading || businessLoading) {
      return;
    }

    // Priority 1: Super Admin -> /super-admin
    if (isSuperAdmin) {
      navigate('/super-admin', { replace: true });
      return;
    }

    // Priority 2: Provider/Dentist -> /dentist/dashboard
    if (isDentist) {
      if (businessId || memberships.length === 0) {
        navigate('/dentist/dashboard', { replace: true });
      }
      return;
    }

    // Priority 3: Check for email verification and profile completion for patients
    const checkPatientStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // Check profile completion
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, date_of_birth')
            .eq('user_id', user.id)
            .single();

          if (!profile?.first_name || !profile?.last_name || !profile?.date_of_birth) {
            navigate('/onboarding', { replace: true });
            return;
          }
        }

        navigate('/dashboard', { replace: true });
      } catch (error) {
        console.error("Error in AuthRedirectHandler:", error);
        // Fallback to dashboard if something fails, to avoid getting stuck
        navigate('/dashboard', { replace: true });
      }
    };

    checkPatientStatus();
  }, [isSuperAdmin, isDentist, superAdminLoading, roleLoading, businessLoading, businessId, memberships.length, navigate]);

  if (superAdminLoading || roleLoading || businessLoading) {
    return (
      <ModernLoadingSpinner
        variant="overlay"
        size="lg"
        message="Redirecting..."
        description="Setting up your workspace..."
      />
    );
  }

  return null;
}
