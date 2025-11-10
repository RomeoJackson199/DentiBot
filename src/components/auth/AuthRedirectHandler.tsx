import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsSuperAdmin } from '@/hooks/useSuperAdmin';
import { useUserRole } from '@/hooks/useUserRole';
import { ModernLoadingSpinner } from '@/components/enhanced/ModernLoadingSpinner';

export function AuthRedirectHandler() {
  const navigate = useNavigate();
  const { data: isSuperAdmin, isLoading: superAdminLoading } = useIsSuperAdmin();
  const { loading: roleLoading, isDentist } = useUserRole();

  useEffect(() => {
    // Wait for both checks to complete
    if (superAdminLoading || roleLoading) {
      return;
    }

    // Priority 1: Super Admin -> /super-admin
    if (isSuperAdmin) {
      navigate('/super-admin', { replace: true });
      return;
    }

    // Priority 2: Provider/Dentist -> /dentist/dashboard
    if (isDentist) {
      navigate('/dentist/dashboard', { replace: true });
      return;
    }

    // Priority 3: Everyone else (patients) -> /dashboard
    navigate('/dashboard', { replace: true });
  }, [isSuperAdmin, isDentist, superAdminLoading, roleLoading, navigate]);

  if (superAdminLoading || roleLoading) {
    return (
      <ModernLoadingSpinner 
        variant="overlay" 
        size="lg"
        message="Redirecting..." 
        description="Taking you to your dashboard..." 
      />
    );
  }

  return null;
}
