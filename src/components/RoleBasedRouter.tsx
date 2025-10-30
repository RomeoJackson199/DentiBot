import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { ModernLoadingSpinner } from "@/components/enhanced/ModernLoadingSpinner";
import { supabase } from "@/integrations/supabase/client";

interface RoleBasedRouterProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'dentist' | 'provider' | 'patient';
  redirectTo?: string;
}

export function RoleBasedRouter({ children, requiredRole, redirectTo = "/" }: RoleBasedRouterProps) {
  const { roles, loading, hasRole, isDentist, isAdmin, isPatient } = useUserRole();
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;

    const checkAccess = async () => {
      if (requiredRole) {
        const hasRequiredRole = requiredRole === 'dentist' ? isDentist : hasRole(requiredRole);
        if (!hasRequiredRole) {
          navigate(redirectTo, { replace: true });
          return;
        }

        // Extra verification for dentist: ensure dentist/provider record exists and is active
        if (requiredRole === 'dentist') {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .eq('user_id', user.id)
              .maybeSingle();

            if (profile) {
              // Check dentists table first
              const { data: dentist } = await supabase
                .from('dentists')
                .select('id, is_active')
                .eq('profile_id', profile.id)
                .maybeSingle();

              if (dentist) {
                if (!dentist.is_active) {
                  console.warn('Access denied: dentist record is not active');
                  navigate(redirectTo, { replace: true });
                  return;
                }
              } else {
                // No dentist record, check providers table
                const { data: provider } = await supabase
                  .from('providers')
                  .select('is_active')
                  .eq('profile_id', profile.id)
                  .maybeSingle();

                if (provider) {
                  if (!provider.is_active) {
                    console.warn('Access denied: provider record is not active');
                    navigate(redirectTo, { replace: true });
                    return;
                  }
                } else {
                  // Neither dentist nor provider exists - auto-create dentist record
                  const { error: insertError } = await supabase
                    .from('dentists')
                    .insert({
                      profile_id: profile.id,
                      is_active: true
                    });

                  if (insertError) {
                    console.error('Failed to create dentist record:', insertError);
                    navigate(redirectTo, { replace: true });
                    return;
                  }
                }
              }
            }
          }
        }
      }

      setAuthorized(true);
    };

    checkAccess();
  }, [loading, requiredRole, hasRole, isDentist, roles, navigate, redirectTo]);

  if (loading) {
    return <ModernLoadingSpinner variant="overlay" message="Verifying access..." />;
  }

  if (!authorized) {
    return <ModernLoadingSpinner variant="overlay" message="Redirecting..." />;
  }

  return <>{children}</>;
}
