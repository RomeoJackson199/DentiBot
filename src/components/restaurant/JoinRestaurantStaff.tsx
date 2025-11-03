import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UserPlus } from 'lucide-react';

export function JoinRestaurantStaff() {
  const { toast } = useToast();
  const [code, setCode] = useState('');

  const joinMutation = useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc('join_restaurant_staff_with_code', {
        p_code: code.toUpperCase(),
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({ 
        title: 'Success!', 
        description: `You've joined as ${data.role}` 
      });
      setCode('');
      // Reload to update the UI
      window.location.reload();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error joining staff', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      joinMutation.mutate(code.trim());
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Join as Staff Member
        </CardTitle>
        <CardDescription>
          Enter the staff code provided by your employer to join their team
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="staff-code">Staff Code</Label>
            <Input
              id="staff-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-character code"
              maxLength={6}
              className="font-mono uppercase"
            />
          </div>
          <Button 
            type="submit" 
            disabled={code.length !== 6 || joinMutation.isPending}
          >
            {joinMutation.isPending ? 'Joining...' : 'Join Staff'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
