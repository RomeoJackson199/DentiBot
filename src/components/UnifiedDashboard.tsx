import React, { useState, useEffect, useCallback, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { PatientDashboard } from "./PatientDashboard";
import { AiOptOutPrompt } from "./AiOptOutPrompt";
import { ModernLoadingSpinner } from "@/components/enhanced/ModernLoadingSpinner";

interface UnifiedDashboardProps {
  user: User;
}

export const UnifiedDashboard = memo(({ user }: UnifiedDashboardProps) => {
  const [userRole, setUserRole] = useState<'patient' | 'dentist' | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

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
          // Redirect dentists to new sidebar layout
          navigate('/dentist/clinical/dashboard', { replace: true });
          return;
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
  }, [user.id, toast, navigate]);

  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  if (loading) {
    return (
      <ModernLoadingSpinner 
        variant="overlay" 
        size="lg"
        message="Loading Dashboard" 
        description="Setting up your personalized experience..." 
      />
    );
  }

  return (
    <>
      {/* Only show patient dashboard since dentists get redirected */}
      <PatientDashboard user={user} />
      <AiOptOutPrompt user={user} />
    </>
  );
});

UnifiedDashboard.displayName = 'UnifiedDashboard';

export default UnifiedDashboard;