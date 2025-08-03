import { useState, useEffect } from "react";
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

export const UnifiedDashboard = ({ user }: UnifiedDashboardProps) => {
  const [userRole, setUserRole] = useState<'patient' | 'dentist' | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserRole();
  }, [user]);

  const fetchUserRole = async () => {
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
    } catch (error: any) {
      console.error('Error fetching user role:', error);
      // Default to patient if there's an error
      setUserRole('patient');
      toast({
        title: "Error",
        description: `Error loading dashboard: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <Card className="glass-card animate-fade-in">
          <CardContent className="p-8 text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-dental-primary" />
            <h3 className="text-lg font-semibold">Loading Dashboard</h3>
            <p className="text-dental-muted-foreground">Determining your access level...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen mesh-bg">
      {userRole === 'dentist' ? (
        <DentistDashboard user={user} />
      ) : (
        <PatientDashboard user={user} />
      )}
      <AiOptOutPrompt user={user} />
    </div>
  );
};