import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { EmergencyTriageEntry } from "@/components/EmergencyTriageEntry";
import { AuthForm } from "@/components/AuthForm";
import { useToast } from "@/hooks/use-toast";

const EmergencyTriage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleComplete = (appointmentData?: any) => {
    if (appointmentData) {
      toast({
        title: "Success!",
        description: "Your emergency appointment has been booked successfully.",
      });
    }
    navigate("/");
  };

  const handleCancel = () => {
    navigate("/");
  };

  const handleAuthRequired = () => {
    setShowAuth(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (showAuth && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <AuthForm />
        </div>
      </div>
    );
  }

  return (
    <EmergencyTriageEntry
      user={user}
      onComplete={handleComplete}
      onCancel={handleCancel}
    />
  );
};

export default EmergencyTriage;