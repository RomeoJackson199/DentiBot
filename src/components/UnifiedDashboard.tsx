import React, { useState, useEffect, useCallback, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { PatientDashboard } from "./PatientDashboard";
import { PatientDashboardRefactored } from "./patient/PatientDashboardRefactored";
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
      console.log('Fetching user role for user:', user.id);
      
      // First get the user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('Profile query result:', { profile, profileError });

      if (profileError) {
        console.error('Profile error:', profileError);
        throw profileError;
      }

      if (!profile) {
        console.log('No profile found, defaulting to patient');
        setUserRole('patient');
        return;
      }

      console.log('User profile role:', profile.role);

      // Check if user is a dentist by checking both role and dentist table
      if (profile.role === 'dentist') {
        console.log('User has dentist role, checking dentist table...');
        
        const { data: dentist, error: dentistError } = await supabase
          .from('dentists')
          .select('id, is_active')
          .eq('profile_id', profile.id)
          .maybeSingle();

        console.log('Dentist query result:', { dentist, dentistError });

        if (!dentistError && dentist?.is_active) {
          console.log('User is an active dentist, setting role to dentist');
          setUserRole('dentist');
        } else {
          console.log('User is not an active dentist, defaulting to patient');
          setUserRole('patient');
        }
      } else {
        console.log('User role is not dentist, setting to patient');
        setUserRole('patient');
      }
    } catch (error: unknown) {
      console.error('Error fetching user role:', error);
      // Default to patient if there's an error
      setUserRole('patient');
      toast({
        title: "Error",
        description: `Error loading dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

  // Check if we should use the refactored dashboard (can be controlled by a feature flag)
  const useRefactoredDashboard = true; // Set to true to use the new refactored dashboard

  return (
    <>
      {userRole === 'dentist' ? (
        <DentistDashboard user={user} />
      ) : (
        useRefactoredDashboard ? (
          <PatientDashboardRefactored user={user} />
        ) : (
          <PatientDashboard user={user} />
        )
      )}
      <AiOptOutPrompt user={user} />
    </>
  );
});

UnifiedDashboard.displayName = 'UnifiedDashboard';