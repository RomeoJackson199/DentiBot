import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionManager } from '@/components/subscription/SubscriptionManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const SubscriptionPage: React.FC = () => {
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['current_profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: membership, isLoading: membershipLoading } = useQuery({
    queryKey: ['user_membership', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      
      const { data, error } = await supabase
        .from('organization_members')
        .select('*, organizations(*)')
        .eq('profile_id', profile.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  if (profileLoading || membershipLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>No Organization</CardTitle>
            <CardDescription>
              You need to be part of an organization to manage subscriptions.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Subscription Management</h1>
        <p className="text-muted-foreground">
          Manage your organization's subscription and billing
        </p>
      </div>

      <SubscriptionManager organizationId={membership.organization_id} />
    </div>
  );
};

export default SubscriptionPage;
