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
        console.error('Profile fetch error:', profileError);
        // Default to patient on error
        setUserRole('patient');
        setLoading(false);
        return;
      }

      if (!profile) {
        console.log('No profile found, defaulting to patient');
        setUserRole('patient');
        setLoading(false);
        return;
      }

      console.log('User profile role:', profile.role);

      if (profile.role === 'dentist') {
        const { data: dentist, error: dentistError } = await supabase
          .from('dentists')
          .select('id, is_active')
          .eq('profile_id', profile.id)
          .maybeSingle();

        console.log('Dentist record:', dentist, 'Error:', dentistError);

        if (!dentistError && dentist?.is_active) {
          setUserRole('dentist');
          setLoading(false);
          // Redirect dentists to new sidebar layout
          navigate('/dentist/clinical/dashboard', { replace: true });
          return;
        } else {
          // User has dentist role but no active dentist record - treat as patient
          console.log('Dentist role but no active record, treating as patient');
          setUserRole('patient');
        }
      } else {
        // User is a patient
        console.log('User is a patient');
        setUserRole('patient');
      }
    } catch (error: unknown) {
      console.error('Dashboard loading error:', error);
      // Default to patient on any error
      setUserRole('patient');
      toast({
        title: "Loading Dashboard", 
        description: "Loading your patient dashboard...",
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