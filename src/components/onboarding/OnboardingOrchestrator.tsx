import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { DentistOnboardingFlow } from "./DentistOnboardingFlow";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface OnboardingOrchestratorProps {
  user: User | null;
}

export const OnboardingOrchestrator = ({ user }: OnboardingOrchestratorProps) => {
  // DISABLED: Onboarding flow is temporarily disabled
  // Return null to prevent the welcome popup from showing
  return null;
};
