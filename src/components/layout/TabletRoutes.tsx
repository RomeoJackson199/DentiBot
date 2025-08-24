import React from "react";
import { Routes, Route } from "react-router-dom";
import DentistDashboard from "@/pages/DentistDashboard";
import Analytics from "@/pages/Analytics";
import Schedule from "@/pages/Schedule";
import ClinicalPatients from "@/pages/ClinicalPatients";
import BusinessPayments from "@/pages/BusinessPayments";
import BusinessReports from "@/pages/BusinessReports";
import OpsInventory from "@/pages/OpsInventory";
import OpsImports from "@/pages/OpsImports";
import AdminSchedule from "@/pages/AdminSchedule";
import AdminBranding from "@/pages/AdminBranding";
import AdminSecurity from "@/pages/AdminSecurity";
import PaymentCancelled from "@/pages/PaymentCancelled";
import PaymentSuccess from "@/pages/PaymentSuccess";

export function TabletRoutes() {
  return (
    <Routes>
      {/* Clinical */}
      <Route path="/clinical" element={<DentistDashboard asPage />} />
      <Route path="/clinical/schedule" element={<Schedule />} />
      <Route path="/clinical/patients" element={<ClinicalPatients />} />
      <Route path="/clinical/appointments" element={<Schedule />} />
      {/* Business */}
      <Route path="/business/payments" element={<BusinessPayments />} />
      <Route path="/business/analytics" element={<Analytics />} />
      <Route path="/business/reports" element={<BusinessReports />} />
      {/* Operations */}
      <Route path="/ops/inventory" element={<OpsInventory />} />
      <Route path="/ops/imports" element={<OpsImports />} />
      {/* Admin */}
      <Route path="/admin/schedule" element={<AdminSchedule />} />
      <Route path="/admin/branding" element={<AdminBranding />} />
      <Route path="/admin/security" element={<AdminSecurity />} />
      {/* Payments callbacks */}
      <Route path="/payment-cancelled" element={<PaymentCancelled />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
    </Routes>
  );
}

export default TabletRoutes;

