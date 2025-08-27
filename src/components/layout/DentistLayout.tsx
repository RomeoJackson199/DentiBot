import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { DentistAppShell } from "./DentistAppShell";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

interface DentistLayoutProps {
  user: User;
  children?: React.ReactNode;
}

export function DentistLayout({ user, children }: DentistLayoutProps) {
  const [dentistId, setDentistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const location = useLocation();

  useEffect(() => {
    fetchDentistProfile();
  }, [user]);

  const fetchDentistProfile = async () => {
    try {
      // Get the dentist profile for this user
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      const { data: dentist, error: dentistError } = await supabase
        .from('dentists')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (dentistError) {
        throw new Error('You are not registered as a dentist');
      }

      setDentistId(dentist.id);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    // Handle any tab change logic here
    console.log('Tab changed to:', tab);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!dentistId) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              You are not registered as a dentist. Please contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {children || <Outlet context={{ user, dentistId }} />}
    </div>
  );
}