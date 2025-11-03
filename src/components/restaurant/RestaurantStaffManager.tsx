import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, UserCheck, UserX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RestaurantStaffManagerProps {
  businessId: string;
}

export function RestaurantStaffManager({ businessId }: RestaurantStaffManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    role: 'waiter' as 'waiter' | 'cook' | 'host' | 'manager',
  });

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
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // First, find the profile by email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', data.email)
        .single();
      
      if (profileError || !profile) {
        throw new Error('User not found with that email');
      }

      // Then assign the role
      const { error } = await supabase
        .from('restaurant_staff_roles')
        .insert({
          business_id: businessId,
          profile_id: profile.id,
          role: data.role,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-staff'] });
      setIsOpen(false);
      setFormData({ email: '', role: 'waiter' });
      toast({ title: 'Staff member added successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error adding staff', description: error.message, variant: 'destructive' });
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Staff Management</h2>
          <p className="text-muted-foreground">Assign roles to your team members</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Staff Member</DialogTitle>
              <DialogDescription>Assign a role to a team member by their email</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="team@example.com"
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="waiter">Waiter/Server</SelectItem>
                    <SelectItem value="cook">Cook/Chef</SelectItem>
                    <SelectItem value="host">Host/Hostess</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button onClick={() => assignRoleMutation.mutate(formData)}>
                Add Staff Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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
      </div>

      {staff?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No staff members assigned yet</p>
            <Button onClick={() => setIsOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Staff Member
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
