import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Copy, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RestaurantStaffCodesProps {
  businessId: string;
}

const ROLE_LABELS = {
  waiter: 'Waiter/Server',
  cook: 'Cook/Chef',
  host: 'Host/Hostess',
  manager: 'Manager',
};

export function RestaurantStaffCodes({ businessId }: RestaurantStaffCodesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: codes, isLoading } = useQuery({
    queryKey: ['restaurant-staff-codes', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_staff_codes')
        .select('*')
        .eq('business_id', businessId)
        .order('role');
      
      if (error) throw error;
      return data;
    },
  });

  const generateCodeMutation = useMutation({
    mutationFn: async (role: string) => {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) throw new Error('Not authenticated');

      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (profileErr) throw profileErr;
      if (!profile?.id) throw new Error('Profile not found');

      const { error } = await supabase
        .from('restaurant_staff_codes')
        .upsert({
          business_id: businessId,
          role,
          code,
          created_by_profile_id: profile.id,
        }, { onConflict: 'business_id,role' });
      
      if (error) throw error;
      return code;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-staff-codes'] });
      toast({ title: 'Code generated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error generating code', description: error.message, variant: 'destructive' });
    },
  });

  const regenerateCodeMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { error } = await supabase
        .from('restaurant_staff_codes')
        .update({ code })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-staff-codes'] });
      toast({ title: 'Code regenerated' });
    },
  });

  const copyToClipboard = (code: string, role: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Code copied', description: `${ROLE_LABELS[role as keyof typeof ROLE_LABELS]} code copied to clipboard` });
  };

  const availableRoles = Object.keys(ROLE_LABELS).filter(
    role => !codes?.find(c => c.role === role)
  );

  if (isLoading) {
    return <div>Loading codes...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Staff Join Codes</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Generate unique codes for each role. Share these codes with your staff so they can join your team.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {codes?.map((codeRecord) => (
          <Card key={codeRecord.id}>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>{ROLE_LABELS[codeRecord.role as keyof typeof ROLE_LABELS]}</span>
                <Badge variant="outline">{codeRecord.role}</Badge>
              </CardTitle>
              <CardDescription>Share this code with your {codeRecord.role}s</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted px-3 py-2 rounded text-lg font-mono font-bold">
                  {codeRecord.code}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(codeRecord.code, codeRecord.role)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => regenerateCodeMutation.mutate({ id: codeRecord.id, role: codeRecord.role })}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {availableRoles.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">Generate codes for:</p>
          <div className="flex flex-wrap gap-2">
            {availableRoles.map((role) => (
              <Button
                key={role}
                variant="outline"
                onClick={() => generateCodeMutation.mutate(role)}
                disabled={generateCodeMutation.isPending}
              >
                {ROLE_LABELS[role as keyof typeof ROLE_LABELS]}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
