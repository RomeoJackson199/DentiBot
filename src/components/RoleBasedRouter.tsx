import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { ModernLoadingSpinner } from "@/components/enhanced/ModernLoadingSpinner";

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

    // Check authorization based on required role
    if (requiredRole) {
      const hasRequiredRole = requiredRole === 'dentist' ? isDentist : hasRole(requiredRole);
      
      if (!hasRequiredRole) {
        console.log(`Access denied: Required role ${requiredRole} not found. User roles:`, roles);
        navigate(redirectTo, { replace: true });
        return;
      }
    }

    setAuthorized(true);
  }, [loading, requiredRole, hasRole, isDentist, isAdmin, isPatient, roles, navigate, redirectTo]);

  if (loading) {
    return <ModernLoadingSpinner variant="overlay" message="Verifying access..." />;
  }

  if (!authorized) {
    return <ModernLoadingSpinner variant="overlay" message="Redirecting..." />;
  }

  return <>{children}</>;
}
