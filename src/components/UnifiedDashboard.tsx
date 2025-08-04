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
    } catch (error: unknown) {
      console.error('Error fetching user role:', error);
      // Default to patient if there's an error
      setUserRole('patient');
      toast({
        title: "Error",
        description: `Error loading dashboard: ${(error as any)?.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <Card 
          variant="glass-strong" 
          className="animate-fade-in p-10 max-w-md mx-auto border-dental-primary/20"
        >
          <CardContent className="text-center space-y-6" padding="none">
            {/* Enhanced loading icon */}
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto shadow-elegant animate-float">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
              <div className="pulse-ring w-20 h-20 -top-2 -left-2"></div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-2xl font-bold gradient-text">Loading Dashboard</h3>
              <p className="text-dental-muted-foreground leading-relaxed">
                Determining your access level and personalizing your experience...
              </p>
            </div>
            
            {/* Progress indicator */}
            <div className="w-full">
              <div className="w-full bg-dental-muted/20 rounded-full h-2">
                <div className="bg-gradient-primary h-2 rounded-full animate-pulse" style={{ width: "60%" }}></div>
              </div>
            </div>
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