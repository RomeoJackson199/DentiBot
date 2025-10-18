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
  const { isProvider, isAdmin, loading: roleLoading } = useUserRole();

  useEffect(() => {
    const checkDentistRedirect = async () => {
      if (roleLoading) return;

      const selectedClinicDentistId = sessionStorage.getItem('selectedBusinessId');
      const selectedClinicSlug = sessionStorage.getItem('selectedBusinessSlug');
      const selectedClinicName = sessionStorage.getItem('selectedBusinessName');
      const accessMode = sessionStorage.getItem('accessMode');

      console.log('🔍 UnifiedDashboard - Session data:', {
        selectedClinicDentistId,
        selectedClinicSlug,
        selectedClinicName,
        accessMode,
        isProvider,
        isAdmin
      });

      // If a business was selected, check the access mode
      if (selectedClinicSlug && accessMode) {
        console.log('✅ Business selected with access mode:', accessMode);
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        console.log('👤 User profile:', profile);

        if (profile) {
          const { data: business } = await supabase
            .from('businesses' as any)
            .select('id, owner_profile_id')
            .eq('slug', selectedClinicSlug)
            .maybeSingle();

          console.log('🏢 Business data:', business);

          // Check if user owns this business
          const ownsBusiness = business?.owner_profile_id === profile.id;
          console.log('🔑 Owns business?', ownsBusiness);

          if (accessMode === 'admin' && ownsBusiness) {
            // Admin access to own business - redirect to business dashboard
            console.log('🚀 Redirecting to business dashboard (admin mode)');
            sessionStorage.removeItem('selectedBusinessId');
            sessionStorage.removeItem('selectedBusinessSlug');
            sessionStorage.removeItem('selectedBusinessName');
            sessionStorage.removeItem('accessMode');
            setShouldRedirect(true);
            navigate('/dentist/admin/branding', { replace: true });
            return;
          } else if (accessMode === 'patient') {
            // Patient access - stay on patient dashboard
            console.log('👥 Accessing business as patient - keeping context for filtering');
            sessionStorage.removeItem('accessMode');
          }
        }
      }

      // If no business selected, redirect providers/admins to business selector by default
      if (!selectedClinicSlug && !accessMode && (isProvider || isAdmin)) {
        console.log('🔄 No business selected, checking if provider has businesses...');
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile) {
          const { data: businesses } = await supabase
            .from('businesses' as any)
            .select('id')
            .eq('owner_profile_id', profile.id);

          console.log('🏢 Found businesses:', businesses);
          if (businesses && businesses.length > 0) {
            console.log('✅ Provider with businesses - redirecting to admin dashboard');
            setShouldRedirect(true);
            navigate('/dentist/admin/branding', { replace: true });
            return;
          }
        }
      }
    };

    checkDentistRedirect();
  }, [user.id, navigate, isProvider, isAdmin, roleLoading]);

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