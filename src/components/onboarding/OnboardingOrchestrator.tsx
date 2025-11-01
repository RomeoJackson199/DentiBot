import { useEffect, useState } from "react";
import { DentistOnboardingFlow } from "./DentistOnboardingFlow";
import { PatientOnboardingFlow } from "./PatientOnboardingFlow";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface OnboardingOrchestratorProps {
  user: User | null;
}

export const OnboardingOrchestrator = ({ user }: OnboardingOrchestratorProps) => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingType, setOnboardingType] = useState<"dentist" | "patient" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    checkOnboardingStatus();
  }, [user]);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    try {
      // Check if user has completed onboarding
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, onboarding_completed, role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error checking onboarding status:', error);
        setLoading(false);
        return;
      }

      // If onboarding not completed, determine which flow to show
      if (!profile?.onboarding_completed) {
        // Check if user has business memberships (dentist/provider)
        const { data: memberships } = await supabase
          .from('business_members')
          .select('role')
          .eq('profile_id', profile.id);

        if (memberships && memberships.length > 0) {
          // User is a dentist/provider
          setOnboardingType("dentist");
        } else {
          // User is a patient
          setOnboardingType("patient");
        }

        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Error in checkOnboardingStatus:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowOnboarding(false);
    setOnboardingType(null);
  };

  if (loading || !user) {
    return null;
  }

  if (!showOnboarding || !onboardingType) {
    return null;
  }

  return (
    <>
      {onboardingType === "dentist" && (
        <DentistOnboardingFlow
          isOpen={showOnboarding}
          onClose={handleClose}
          userId={user.id}
        />
      )}
      {onboardingType === "patient" && (
        <PatientOnboardingFlow
          isOpen={showOnboarding}
          onClose={handleClose}
          userId={user.id}
        />
      )}
    </>
  );
};
