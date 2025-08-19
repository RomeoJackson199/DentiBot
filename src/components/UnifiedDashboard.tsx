import React, { useState, useEffect, useCallback, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { PatientDashboard } from "./PatientDashboard";
import { DentistDashboard } from "../pages/DentistDashboard";
import { AiOptOutPrompt } from "./AiOptOutPrompt";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface UnifiedDashboardProps {
  user: User;
}

export const UnifiedDashboard = memo(({ user }: UnifiedDashboardProps) => {
  const [userRole, setUserRole] = useState<'patient' | 'dentist' | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserRole = useCallback(async () => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (!profile) {
        setUserRole('patient');
        return;
      }

      if (profile.role === 'dentist') {
        const { data: dentist, error: dentistError } = await supabase
          .from('dentists')
          .select('id, is_active')
          .eq('profile_id', profile.id)
          .maybeSingle();

        if (!dentistError && dentist?.is_active) {
          setUserRole('dentist');
        } else {
          setUserRole('patient');
        }
      } else {
        setUserRole('patient');
      }
    } catch (error: unknown) {
      setUserRole('patient');
      console.error('Dashboard loading error:', error);
      toast({
        title: "Dashboard Error", 
        description: `Error loading dashboard: ${error instanceof Error ? error.message : 'Unknown error'}. Please try refreshing the page.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user.id, toast]);

  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center mesh-bg">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-dental-primary/20 border-t-dental-primary"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-dental-accent animate-pulse"></div>
            </div>
            <div className="mt-6 text-center space-y-2">
              <h3 className="text-lg font-semibold text-dental-foreground">Loading Dashboard</h3>
              <p className="text-sm text-dental-muted-foreground">Setting up your personalized experience...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {userRole === 'dentist' ? (
        <DentistDashboard user={user} />
      ) : (
        <PatientDashboard user={user} />
      )}
      <AiOptOutPrompt user={user} />
    </>
  );
});

UnifiedDashboard.displayName = 'UnifiedDashboard';