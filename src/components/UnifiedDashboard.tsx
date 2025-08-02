import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { PatientDashboard } from "./PatientDashboard";
import { DentistDashboard } from "../pages/DentistDashboard";
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
      // First get the user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Check if user is a dentist by checking both role and dentist table
      if (profile.role === 'dentist') {
        const { data: dentist, error: dentistError } = await supabase
          .from('dentists')
          .select('id, is_active')
          .eq('profile_id', profile.id)
          .single();

        if (!dentistError && dentist?.is_active) {
          setUserRole('dentist');
        } else {
          setUserRole('patient');
        }
      } else {
        setUserRole('patient');
      }
    } catch (error: any) {
      console.error('Error fetching user role:', error);
      // Default to patient if there's an error
      setUserRole('patient');
      toast({
        title: "Note",
        description: "Defaulting to patient dashboard",
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
    </div>
  );
};