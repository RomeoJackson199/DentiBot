import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { differenceInDays } from 'date-fns';

export const DemoModeBanner: React.FC = () => {
  const navigate = useNavigate();

  const { data: organization } = useQuery({
    queryKey: ['current_organization'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!profile) return null;

      const { data: membership } = await supabase
        .from('organization_members')
        .select('*, organizations(*)')
        .eq('profile_id', profile.id)
        .single();

      return membership?.organizations;
    },
  });

  if (!organization?.is_demo) return null;

  const daysLeft = organization.demo_expires_at 
    ? differenceInDays(new Date(organization.demo_expires_at), new Date())
    : 0;

  const isExpiringSoon = daysLeft <= 3;

  return (
    <Alert 
      className="border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/20"
      variant={isExpiringSoon ? "destructive" : "default"}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <AlertTitle className="text-amber-900 dark:text-amber-100">
              Demo Mode Active
            </AlertTitle>
            <AlertDescription className="text-amber-800 dark:text-amber-200 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {daysLeft > 0 ? (
                <span>
                  {daysLeft} day{daysLeft !== 1 ? 's' : ''} left in your trial
                </span>
              ) : (
                <span className="font-semibold">Trial expired</span>
              )}
            </AlertDescription>
          </div>
        </div>
        <Button 
          variant="default" 
          size="sm"
          onClick={() => navigate('/subscription')}
          className="ml-4"
        >
          Upgrade Now
        </Button>
      </div>
    </Alert>
  );
};
