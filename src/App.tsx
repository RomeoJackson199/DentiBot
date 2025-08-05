import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "./hooks/useLanguage";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import ProfileCompletionDialog from "./components/ProfileCompletionDialog";
import { ChangelogPopup } from "./components/ChangelogPopup";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import Index from "./pages/Index";
import DentistProfiles from "./pages/DentistProfiles";
import Terms from "./pages/Terms";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";
import EmergencyTriage from "./pages/EmergencyTriage";
import { PaymentSuccess } from "./pages/PaymentSuccess";
import { PaymentCancelled } from "./pages/PaymentCancelled";
import Schedule from "./pages/Schedule";
import Analytics from "./pages/Analytics";
import Support from "./pages/Support";
import FeatureDetail from "./pages/FeatureDetail";
import { UnifiedDashboard } from "./components/UnifiedDashboard";
import { LanguageTest } from "./components/LanguageTest";

// Dashboard component that handles authentication
const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(error => {
      console.error('Error getting session:', error);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto shadow-elegant animate-float">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
            <div className="pulse-ring w-20 h-20 -top-2 -left-2"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold gradient-text">Loading dashboard</h3>
            <p className="text-dental-muted-foreground">Preparing your personalized experience...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to home page if not authenticated
    return <Navigate to="/" replace />;
  }

  return <UnifiedDashboard user={user} />;
};

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={true}
        disableTransitionOnChange={false}
      >
        <LanguageProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <PWAInstallPrompt />
              <ProfileCompletionDialog />
              <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/emergency-triage" element={<EmergencyTriage />} />
                <Route path="/dentists" element={<DentistProfiles />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/payment-cancelled" element={<PaymentCancelled />} />
                <Route path="/schedule" element={<Schedule />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/support" element={<Support />} />
                <Route path="/features/:id" element={<FeatureDetail />} />
                <Route path="/language-test" element={<LanguageTest />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
