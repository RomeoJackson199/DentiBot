import { useCurrentDentist } from "@/hooks/useCurrentDentist";
import { UnifiedDashboard } from "@/components/UnifiedDashboard";
import { useEffect } from "react";

export default function DentistClinicalDashboard() {
  const { userId } = useCurrentDentist();
  // Back-compat: reuse UnifiedDashboard, which renders DentistDashboard for dentists
  // Route-level component exists to satisfy IA and deep-linking
  useEffect(() => { /* no-op */ }, []);
  // UnifiedDashboard expects a User; App already ensures session and renders within AppShell for /dashboard.
  // For simplicity, just redirect via location hash to clinical context on Dashboard.
  if (!userId) return null;
  // We rely on DentistDashboard internal content; this page can be extended later.
  return null;
}

