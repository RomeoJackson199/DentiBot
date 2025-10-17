import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IndustrySelectionFlow } from '@/components/onboarding/IndustrySelectionFlow';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();

  // Check authentication first
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['current_user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: hasOrganization, isLoading } = useQuery({
    queryKey: ['has_organization', user?.id],
    queryFn: async () => {
      if (!user) return false;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (!profile) return false;

      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('profile_id', profile.id)
        .maybeSingle();

      return !!membership;
    },
    enabled: !!user,
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      navigate('/signup');
    }
  }, [user, userLoading, navigate]);

  // Redirect to dashboard if already has organization
  useEffect(() => {
    if (!isLoading && hasOrganization) {
      navigate('/dashboard');
    }
  }, [hasOrganization, isLoading, navigate]);

  if (userLoading || isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to signup
  }

  return (
    <IndustrySelectionFlow 
      onComplete={() => navigate('/dashboard')} 
    />
  );
};

export default OnboardingPage;
