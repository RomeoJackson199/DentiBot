import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsSuperAdmin } from '@/hooks/useSuperAdmin';
import { useUserRole } from '@/hooks/useUserRole';
import { useBusinessContext } from '@/hooks/useBusinessContext';
import { ModernLoadingSpinner } from '@/components/enhanced/ModernLoadingSpinner';

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
    // Only redirect if business context is set or user has no memberships (patient)
    if (isDentist) {
      if (businessId || memberships.length === 0) {
        navigate('/dentist/dashboard', { replace: true });
      }
      return;
    }

    // Priority 3: Everyone else (patients) -> /dashboard
    // Patients can proceed even without a business (they'll select when booking)
    navigate('/dashboard', { replace: true });
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
