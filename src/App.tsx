import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LanguageProvider } from '@/hooks/useLanguage';
import { Toaster } from '@/components/ui/toaster';
import { toast } from "sonner";
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

import Index from "./pages/Index";
import DentistProfiles from "./pages/DentistProfiles";
import Terms from "./pages/Terms";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";
import { PaymentSuccess } from "./pages/PaymentSuccess";
import { PaymentCancelled } from "./pages/PaymentCancelled";
import Schedule from "./pages/Schedule";
import Analytics from "./pages/Analytics";
import Support from "./pages/Support";
import FeatureDetail from "./pages/FeatureDetail";
import { LanguageTest } from "./components/LanguageTest";

// Dashboard component that handles authentication
const DashboardComponent = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center mesh-bg">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dental-primary mx-auto"></div>
        <p className="text-dental-muted-foreground">Loading dashboard...</p>
      </div>
    </div>;
  }

  if (!user) {
    // Redirect to home page if not authenticated
    return <Navigate to="/" replace />;
  }

  // Import PatientDashboard directly
  const { PatientDashboard } = require('./components/PatientDashboard');
  
  return <PatientDashboard user={user} />;
};

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <LanguageProvider>
          <TooltipProvider>
            <div className="min-h-screen bg-background">
              <Toaster />
              {/* Temporarily removed Sonner */}
              <PWAInstallPrompt />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/dashboard" element={<DashboardComponent />} />
                  <Route path="/emergency-triage" element={
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="text-center">
                        <h1>Emergency Triage</h1>
                        <p>Feature coming soon</p>
                      </div>
                    </div>
                  } />
                  <Route path="/dentist-profiles" element={<DentistProfiles />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/payment/success" element={<PaymentSuccess />} />
                  <Route path="/payment/cancelled" element={<PaymentCancelled />} />
                  <Route path="/schedule" element={<Schedule />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/support" element={<Support />} />
                  <Route path="/features/:id" element={<FeatureDetail />} />
                  <Route path="/language-test" element={<LanguageTest />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </div>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;