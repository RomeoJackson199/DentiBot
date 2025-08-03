import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { PatientDashboard } from "./PatientDashboard";
import { DentistDashboard } from "../pages/DentistDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UnifiedDashboardProps {
  user: User;
}

export const UnifiedDashboard = ({ user }: UnifiedDashboardProps) => {
  const [userRole, setUserRole] = useState<'patient' | 'dentist' | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchUserRole = async () => {
    try {
      console.log('Fetching user role for user:', user.id);
      
      // First get the user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, ai_opt_out, ai_never_prompt')
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

      setProfileId(profile.id);
      if (profile.ai_opt_out && !profile.ai_never_prompt) {
        const promptKey = `ai_prompt_${user.id}`;
        if (!sessionStorage.getItem(promptKey)) {
          setShowAiPrompt(true);
          sessionStorage.setItem(promptKey, 'shown');
        }
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
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error",
        description: `Error loading dashboard: ${message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnableAi = async () => {
    if (!profileId) return;
    const { error } = await supabase
      .from('profiles')
      .update({ ai_opt_out: false })
      .eq('id', profileId);
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to enable AI',
        variant: 'destructive',
      });
      return;
    }
    toast({ title: 'AI Enabled', description: 'Smart assistant activated.' });
    setShowAiPrompt(false);
  };

  const handleNeverAsk = async () => {
    if (!profileId) return;
    const { error } = await supabase
      .from('profiles')
      .update({ ai_never_prompt: true })
      .eq('id', profileId);
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update preference',
        variant: 'destructive',
      });
      return;
    }
    toast({ title: 'Preference Saved', description: 'We will not ask again.' });
    setShowAiPrompt(false);
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
    <>
      <div className="min-h-screen mesh-bg">
        {userRole === 'dentist' ? (
          <DentistDashboard user={user} />
        ) : (
          <PatientDashboard user={user} />
        )}
      </div>
      <Dialog open={showAiPrompt} onOpenChange={setShowAiPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Smart AI Assistant?</DialogTitle>
            <DialogDescription>
              DentiBot’s AI can help you describe your symptoms faster. Would you like to enable it?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleEnableAi}>Enable AI</Button>
            <Button variant="secondary" onClick={() => setShowAiPrompt(false)}>
              Keep Disabled
            </Button>
            <Button variant="ghost" onClick={handleNeverAsk}>
              Never Ask Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};