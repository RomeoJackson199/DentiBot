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
          console.log(`Access denied: Required role ${requiredRole} not found. User roles:`, roles);
          navigate(redirectTo, { replace: true });
          return;
        }

        // Extra verification for dentist: ensure provider record is active
        if (requiredRole === 'dentist') {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .eq('user_id', user.id)
              .maybeSingle();

            if (profile) {
              const { data: provider } = await supabase
                .from('providers')
                .select('is_active')
                .eq('profile_id', profile.id)
                .maybeSingle();

              if (!provider?.is_active) {
                console.warn('Access denied: provider record is not active');
                navigate(redirectTo, { replace: true });
                return;
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
