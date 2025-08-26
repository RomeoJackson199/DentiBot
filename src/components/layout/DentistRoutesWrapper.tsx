import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { DentistLayout } from "./DentistLayout";
import { ModernLoadingSpinner } from "@/components/enhanced/ModernLoadingSpinner";

// Lazy load dentist pages
import { lazy } from "react";
const DentistClinicalDashboard = lazy(() => import("@/pages/DentistClinicalDashboard"));
const DentistClinicalSchedule = lazy(() => import("@/pages/DentistClinicalSchedule"));
const DentistClinicalPatients = lazy(() => import("@/pages/DentistClinicalPatients"));
const DentistClinicalAppointments = lazy(() => import("@/pages/DentistClinicalAppointments"));
const DentistBusinessPayments = lazy(() => import("@/pages/DentistBusinessPayments"));
const DentistBusinessAnalytics = lazy(() => import("@/pages/DentistBusinessAnalytics"));
const DentistBusinessReports = lazy(() => import("@/pages/DentistBusinessReports"));
const DentistOpsInventory = lazy(() => import("@/pages/DentistOpsInventory"));
const DentistOpsImports = lazy(() => import("@/pages/DentistOpsImports"));
const DentistAdminBranding = lazy(() => import("@/pages/DentistAdminBranding"));
const DentistAdminSecurity = lazy(() => import("@/pages/DentistAdminSecurity"));

export function DentistRoutesWrapper() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <ModernLoadingSpinner variant="overlay" message="Loading dentist portal..." />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <DentistLayout user={user}>
      <Routes>
        <Route path="clinical/dashboard" element={<DentistClinicalDashboard />} />
        <Route path="clinical/schedule" element={<DentistClinicalSchedule />} />
        <Route path="clinical/patients" element={<DentistClinicalPatients />} />
        <Route path="clinical/appointments" element={<DentistClinicalAppointments />} />

        <Route path="business/payments" element={<DentistBusinessPayments />} />
        <Route path="business/analytics" element={<DentistBusinessAnalytics />} />
        <Route path="business/reports" element={<DentistBusinessReports />} />

        <Route path="ops/inventory" element={<DentistOpsInventory />} />
        <Route path="ops/imports" element={<DentistOpsImports />} />

        <Route path="admin/branding" element={<DentistAdminBranding />} />
        <Route path="admin/security" element={<DentistAdminSecurity />} />
        
        {/* Default redirect */}
        <Route path="" element={<Navigate to="clinical/dashboard" replace />} />
      </Routes>
    </DentistLayout>
  );
}