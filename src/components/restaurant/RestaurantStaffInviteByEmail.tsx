import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Props {
  businessId: string;
}

export function RestaurantStaffInviteByEmail({ businessId }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('waiter');

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('create_restaurant_staff_invitation', {
        p_business_id: businessId,
        p_email: email.trim(),
        p_role: role,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Invitation sent', description: `Invited ${email} as ${role}.` });
      setEmail('');
      qc.invalidateQueries({ queryKey: ['restaurant-staff', businessId] });
    },
    onError: (e: any) => {
      toast({ title: 'Failed to invite', description: e?.message ?? 'Please try again.', variant: 'destructive' });
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: 'Invalid email address', variant: 'destructive' });
      return;
    }
    inviteMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite Staff by Email</CardTitle>
        <CardDescription>Enter an email and select a role. The user will be prompted to accept on next sign in.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="staff-email">Email</Label>
            <Input
              id="staff-email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="waiter">Waiter</SelectItem>
                <SelectItem value="cook">Cook</SelectItem>
                <SelectItem value="host">Host</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-3">
            <Button type="submit" disabled={inviteMutation.isPending}>Send Invitation</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
