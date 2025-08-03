import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { EmergencyTriageEntry } from "@/components/EmergencyTriageEntry";
import { AuthForm } from "@/components/AuthForm";
import { useToast } from "@/hooks/use-toast";
import { getTriageInfo } from "@/lib/mockApi";

const EmergencyTriage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;
    const init = async () => {
      try {
        const sessionRes = await supabase.auth.getSession();
        setUser(sessionRes.data.session?.user ?? null);
      } catch {
        toast({ title: 'Error', description: 'Unable to load session' });
      } finally {
        setLoading(false);
      }
      getTriageInfo();
      subscription = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      }).data.subscription;
    };
    init();
    return () => subscription?.unsubscribe();
  }, [toast]);

  const handleComplete = (appointmentData?: unknown) => {
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
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    );
  };

export default EmergencyTriage;