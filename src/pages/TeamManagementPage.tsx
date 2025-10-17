import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamMemberInviteDialog } from '@/components/admin/TeamMemberInviteDialog';
import { TeamMembersTable } from '@/components/admin/TeamMembersTable';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';

const TeamManagementPage: React.FC = () => {
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
              You need to be part of an organization to manage team members.
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
              Only organization owners and admins can manage team members.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Users className="h-8 w-8" />
            Team Management
          </h1>
          <p className="text-muted-foreground">
            Invite and manage your organization's team members
          </p>
        </div>
        <TeamMemberInviteDialog organizationId={membership.organization_id} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage roles and permissions for your team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeamMembersTable organizationId={membership.organization_id} />
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamManagementPage;
