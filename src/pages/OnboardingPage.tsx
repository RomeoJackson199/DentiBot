import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IndustrySelectionFlow } from '@/components/onboarding/IndustrySelectionFlow';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: hasOrganization, isLoading } = useQuery({
    queryKey: ['has_organization'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!profile) return false;

      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('profile_id', profile.id)
        .maybeSingle();

      return !!membership;
    },
  });

  useEffect(() => {
    if (!isLoading && hasOrganization) {
      navigate('/dashboard');
    }
  }, [hasOrganization, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <IndustrySelectionFlow 
      onComplete={() => navigate('/dashboard')} 
    />
  );
};

export default OnboardingPage;
