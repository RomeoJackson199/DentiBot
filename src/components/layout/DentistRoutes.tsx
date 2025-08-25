import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { DentistLayout } from "./DentistLayout";
import DentistClinicalDashboard from "@/pages/DentistClinicalDashboard";
import { PatientManagement } from "@/components/PatientManagement";
import { AppointmentManagement } from "@/components/AppointmentManagement";
import { EnhancedAvailabilitySettings } from "@/components/enhanced/EnhancedAvailabilitySettings";
import { PaymentRequestManager } from "@/components/PaymentRequestManager";
import { DentistAnalytics } from "@/components/analytics/DentistAnalytics";
import { InventoryManager } from "@/components/inventory/InventoryManager";
import DataImportManager from "@/components/DataImportManager";
import { ModernSettings } from "@/components/ModernSettings";

interface DentistRoutesProps {
  user: User;
  dentistId: string;
}

export function DentistRoutes({ user, dentistId }: DentistRoutesProps) {
  return (
    <Routes>
      <Route path="/" element={<DentistLayout user={user} />}>
        <Route index element={<Navigate to="/clinical/dashboard" replace />} />
        
        {/* Clinical Routes */}
        <Route path="clinical">
          <Route path="dashboard" element={<DentistClinicalDashboard user={user} />} />
          <Route path="patients" element={<PatientManagement dentistId={dentistId} />} />
          <Route path="appointments" element={<AppointmentManagement dentistId={dentistId} />} />
          <Route path="schedule" element={<EnhancedAvailabilitySettings dentistId={dentistId} />} />
        </Route>

        {/* Business Routes */}
        <Route path="business">
          <Route path="payments" element={<PaymentRequestManager dentistId={dentistId} />} />
          <Route path="analytics" element={
            <DentistAnalytics
              dentistId={dentistId}
              onOpenPatientsTab={() => {}}
              onOpenClinicalTab={() => {}}
              onOpenPaymentsTab={() => {}}
            />
          } />
          <Route path="reports" element={<div className="p-6">Reports coming soon...</div>} />
        </Route>

        {/* Operations Routes */}
        <Route path="ops">
          <Route path="inventory" element={
            <div className="p-6">
              <InventoryManager dentistId={dentistId} userId={user.id} />
            </div>
          } />
          <Route path="imports" element={
            <div className="p-6">
              <DataImportManager />
            </div>
          } />
        </Route>

        {/* Admin Routes */}
        <Route path="admin">
          <Route path="branding" element={<ModernSettings user={user} />} />
          <Route path="security" element={<div className="p-6">Security settings coming soon...</div>} />
        </Route>
      </Route>
    </Routes>
  );
}