import React from "react";
import { Routes, Route } from "react-router-dom";
import DentistDashboard from "@/pages/DentistDashboard";
import Analytics from "@/pages/Analytics";
import Schedule from "@/pages/Schedule";
import PaymentCancelled from "@/pages/PaymentCancelled";
import PaymentSuccess from "@/pages/PaymentSuccess";

export function TabletRoutes() {
  return (
    <Routes>
      <Route path="/dashboard" element={<DentistDashboard asPage />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/schedule" element={<Schedule />} />
      <Route path="/payment-cancelled" element={<PaymentCancelled />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
    </Routes>
  );
}

export default TabletRoutes;

