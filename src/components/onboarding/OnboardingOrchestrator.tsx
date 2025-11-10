import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DentistOnboardingFlow } from "./DentistOnboardingFlow";
import { DemoDataPrompt } from "./DemoDataPrompt";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useBusinessContext } from "@/hooks/useBusinessContext";

interface OnboardingOrchestratorProps {
  user: User | null;
}

export const OnboardingOrchestrator = ({ user }: OnboardingOrchestratorProps) => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDemoPrompt, setShowDemoPrompt] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [demoDataGenerated, setDemoDataGenerated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { business } = useBusinessContext();

  useEffect(() => {
    if (!user) return;

    const checkOnboardingStatus = async () => {
      try {
        // Fetch user profile to check onboarding status
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("onboarding_completed, demo_data_generated, role")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          return;
        }

        // Check if onboarding has been completed
        const hasCompletedOnboarding = profile?.onboarding_completed === true;
        const hasGeneratedDemo = profile?.demo_data_generated === true;
        const role = profile?.role;

        setUserRole(role);
        setOnboardingCompleted(hasCompletedOnboarding);
        setDemoDataGenerated(hasGeneratedDemo);

        // Only show onboarding for dentists/practitioners who haven't completed it
        const isDentistRoute =
          location.pathname.includes("/dentist") ||
          location.pathname.includes("/portal");

        if (!hasCompletedOnboarding && isDentistRoute && role === "dentist") {
          // Show onboarding flow
          setShowOnboarding(true);
        } else if (
          hasCompletedOnboarding &&
          !hasGeneratedDemo &&
          isDentistRoute &&
          role === "dentist"
        ) {
          // Onboarding done, but no demo data yet - offer demo data
          const demoDataSkipped = localStorage.getItem("demo-data-skipped");
          if (!demoDataSkipped) {
            setShowDemoPrompt(true);
          }
        }
      } catch (error) {
        console.error("Error in onboarding orchestrator:", error);
      }
    };

    checkOnboardingStatus();
  }, [user, location.pathname]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setOnboardingCompleted(true);

    // After onboarding, show demo data prompt
    const demoDataSkipped = localStorage.getItem("demo-data-skipped");
    if (!demoDataSkipped && !demoDataGenerated) {
      // Delay slightly so the transition is smooth
      setTimeout(() => {
        setShowDemoPrompt(true);
      }, 500);
    }
  };

  const handleDemoDataComplete = () => {
    setShowDemoPrompt(false);
    setDemoDataGenerated(true);

    // Trigger a tour if needed
    localStorage.setItem("should-start-tour", "true");

    // Refresh the page to load the new demo data
    window.location.reload();
  };

  // Don't show onboarding on login/signup pages
  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/";

  if (isAuthPage || !user || userRole !== "dentist") {
    return null;
  }

  return (
    <>
      {showOnboarding && (
        <DentistOnboardingFlow
          isOpen={showOnboarding}
          onClose={handleOnboardingComplete}
          userId={user.id}
        />
      )}

      {showDemoPrompt && business && (
        <DemoDataPrompt
          isOpen={showDemoPrompt}
          onClose={() => setShowDemoPrompt(false)}
          businessId={business.id}
          userId={user.id}
          onDemoDataGenerated={handleDemoDataComplete}
        />
      )}
    </>
  );
};
