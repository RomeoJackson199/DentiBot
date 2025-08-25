import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { DentistLayout } from "./DentistLayout";
import DentistClinicalDashboard from "@/pages/DentistClinicalDashboard";
import Analytics from "@/pages/Analytics";
import Schedule from "@/pages/Schedule";
import PaymentCancelled from "@/pages/PaymentCancelled";
import PaymentSuccess from "@/pages/PaymentSuccess";

interface TabletRoutesProps {
  user: User;
}

export function TabletRoutes({ user }: TabletRoutesProps) {
  return (
    <Routes>
      <Route path="/dashboard" element={<DentistLayout user={user} />}>
        <Route index element={<DentistClinicalDashboard user={user} />} />
        <Route path="clinical" element={<Navigate to="/dashboard" replace />} />
      </Route>
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/schedule" element={<Schedule />} />
      <Route path="/payment-cancelled" element={<PaymentCancelled />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
    </Routes>
  );
}

export default TabletRoutes;

