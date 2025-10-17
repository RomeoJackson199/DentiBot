import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OrganizationBrandingManager } from '@/components/branding/OrganizationBrandingManager';
import { TerminologyCustomizer } from '@/components/branding/TerminologyCustomizer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const OrganizationSettingsPage: React.FC = () => {
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
        <Skeleton className="h-96 w-full" />
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
              You need to be part of an organization to manage settings.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const canManage = membership.role === 'owner' || membership.role === 'admin';

  if (!canManage) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Only organization owners and admins can manage settings.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Organization Settings</h1>
        <p className="text-muted-foreground">
          Customize your organization's branding and terminology
        </p>
      </div>

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="terminology">Terminology</TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-6">
          <OrganizationBrandingManager organizationId={membership.organization_id} />
        </TabsContent>

        <TabsContent value="terminology" className="space-y-6">
          <TerminologyCustomizer organizationId={membership.organization_id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrganizationSettingsPage;
