import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Trash2, UserCheck, UserX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RestaurantStaffInviteByEmail } from './RestaurantStaffInviteByEmail';

interface RestaurantStaffManagerProps {
  businessId: string;
}

export function RestaurantStaffManager({ businessId }: RestaurantStaffManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: staff, isLoading } = useQuery({
    queryKey: ['restaurant-staff', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_staff_roles')
        .select(`
          *,
          profiles:profile_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('business_id', businessId)
        .eq('is_active', true)
        .is('invitation_status', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('restaurant_staff_roles')
        .update({ is_active: !isActive })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-staff'] });
      toast({ title: 'Staff status updated' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('restaurant_staff_roles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-staff'] });
      toast({ title: 'Staff member removed' });
    },
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'manager': return 'default';
      case 'waiter': return 'secondary';
      case 'cook': return 'outline';
      case 'host': return 'outline';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return <div>Loading staff...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Staff Management</h2>
        <p className="text-muted-foreground">Invite staff by email and manage your team</p>
      </div>

      <RestaurantStaffInviteByEmail businessId={businessId} />

      <div>
        <h3 className="text-lg font-semibold mb-4">Current Staff Members</h3>
        <div className="space-y-4">
          {staff?.map((member: any) => (
            <Card key={member.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {member.profiles?.first_name} {member.profiles?.last_name}
                      {member.is_active ? (
                        <Badge variant="default" className="ml-2">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      {member.profiles?.email}
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        {member.role}
                      </Badge>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleActiveMutation.mutate({ id: member.id, isActive: member.is_active })}
                    >
                      {member.is_active ? (
                        <UserX className="h-4 w-4" />
                      ) : (
                        <UserCheck className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(member.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
          {staff?.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No staff members yet. Send an email invitation above to invite your team.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
