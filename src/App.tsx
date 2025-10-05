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
import { useState, useEffect, lazy, Suspense } from "react";
import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { SeoManager } from "./lib/seo";
import { LazyLoadingWrapper } from "./components/optimized/LazyLoadingWrapper";
import AuthCallbackHandler from "./components/AuthCallbackHandler";
import { ModernLoadingSpinner } from "@/components/enhanced/ModernLoadingSpinner";
import { AppShell } from "@/components/layout/AppShell";
import { DentistLayout } from "@/components/layout/DentistLayout";
import { DentistRoutesWrapper } from "@/components/layout/DentistRoutesWrapper";
import { PatientPortalNav } from "@/components/patient/PatientPortalNav";

const Invite = lazy(() => import("./pages/Invite"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const DentistProfiles = lazy(() => import("./pages/DentistProfiles"));
const Terms = lazy(() => import("./pages/Terms"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const NotFound = lazy(() => import("./pages/NotFound"));
const EmergencyTriage = lazy(() => import("./pages/EmergencyTriage"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCancelled = lazy(() => import("./pages/PaymentCancelled"));
const Chat = lazy(() => import("./pages/Chat"));
const Schedule = lazy(() => import("./pages/Schedule"));
// RecallDeepLink removed - file doesn't exist
const Analytics = lazy(() => import("./pages/Analytics"));
const DentistClinicalDashboard = lazy(() => import("./pages/DentistClinicalDashboard"));
const DentistClinicalSchedule = lazy(() => import("./pages/DentistClinicalSchedule"));
const DentistClinicalPatients = lazy(() => import("./pages/DentistClinicalPatients"));
const DentistClinicalAppointments = lazy(() => import("./pages/DentistClinicalAppointments"));
const DentistBusinessPayments = lazy(() => import("./pages/DentistBusinessPayments"));
const DentistBusinessAnalytics = lazy(() => import("./pages/DentistBusinessAnalytics"));
const DentistBusinessReports = lazy(() => import("./pages/DentistBusinessReports"));
const DentistOpsInventory = lazy(() => import("./pages/DentistOpsInventory"));
const DentistOpsImports = lazy(() => import("./pages/DentistOpsImports"));
const DentistAdminSchedule = lazy(() => import("./pages/DentistAdminSchedule"));
const DentistAdminBranding = lazy(() => import("./pages/DentistAdminBranding"));
const DentistAdminSecurity = lazy(() => import("./pages/DentistAdminSecurity"));
const Support = lazy(() => import("./pages/Support"));
const FeatureDetail = lazy(() => import("./pages/FeatureDetail"));
const UnifiedDashboard = lazy(() => import("./components/UnifiedDashboard"));
const LanguageTest = lazy(() => import("./components/LanguageTest").then(module => ({ default: module.LanguageTest })));
const About = lazy(() => import("./pages/About"));
const Claim = lazy(() => import("./pages/Claim"));
const PatientCareHome = lazy(() => import("./pages/PatientCareHome"));
const PatientAppointmentsPage = lazy(() => import("./pages/PatientAppointmentsPage"));
const PatientPrescriptionsPage = lazy(() => import("./pages/PatientPrescriptionsPage"));
const PatientTreatmentHistoryPage = lazy(() => import("./pages/PatientTreatmentHistoryPage"));
const PatientBillingPage = lazy(() => import("./pages/PatientBillingPage"));
const PatientDocumentsPage = lazy(() => import("./pages/PatientDocumentsPage"));
const PatientAccountProfilePage = lazy(() => import("./pages/PatientAccountProfilePage"));
const PatientAccountInsurancePage = lazy(() => import("./pages/PatientAccountInsurancePage"));
const PatientAccountPrivacyPage = lazy(() => import("./pages/PatientAccountPrivacyPage"));
const PatientAccountHelpPage = lazy(() => import("./pages/PatientAccountHelpPage"));

// Dashboard component that handles authentication with lazy loading
const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingRole, setCheckingRole] = useState(false);

  useEffect(() => {
    const checkUserRole = async (currentUser: User) => {
      setCheckingRole(true);
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('user_id', currentUser.id)
          .maybeSingle();

        if (profile?.role === 'dentist') {
          const { data: dentist } = await supabase
            .from('dentists')
            .select('id, is_active')
            .eq('profile_id', profile.id)
            .maybeSingle();

          if (dentist?.is_active) {
            window.location.href = '/dentist/clinical/dashboard';
            return;
          }
        }
      } catch (error) {
        console.error('Error checking role:', error);
      }
      setCheckingRole(false);
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        checkUserRole(currentUser);
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        checkUserRole(currentUser);
      }
    }).catch(error => {
      console.error('Error getting session:', error);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading || checkingRole) {
    return <ModernLoadingSpinner variant="overlay" message="Loading dashboard..." />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <UnifiedDashboard user={user} />;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry auth errors (401/403)
        if (error && typeof error === 'object') {
          // Check for status codes
          if ('status' in error && (error.status === 401 || error.status === 403)) {
            return false;
          }
          // Check for Supabase error codes
          if ('code' in error) {
            const supabaseError = error as { code?: string };
            if (supabaseError.code === 'PGRST301' || supabaseError.code === 'PGRST116') {
              return false;
            }
          }
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

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
            <AuthCallbackHandler />
            <TooltipProvider>
              <Sonner />
              <PWAInstallPrompt />
              <ProfileCompletionDialog />
              <BrowserRouter>
                <SeoManager />
              <Suspense fallback={<ModernLoadingSpinner variant="overlay" message="Loading..." /> }>
              <Routes>
                <Route path="/" element={<Index />} />
                {/* Old routes for backward compatibility */}
                <Route element={<AppShell />}>
                  {/* Back-compat entry to dentist home */}
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/clinical" element={<Navigate to="/dentist/clinical/dashboard" replace />} />
                  <Route path="/clinical/*" element={<Navigate to="/dentist/clinical/dashboard" replace />} />
                  <Route path="/business/*" element={<Navigate to="/dentist/business/payments" replace />} />
                  <Route path="/ops/*" element={<Navigate to="/dentist/ops/inventory" replace />} />
                  <Route path="/admin/*" element={<Navigate to="/dentist/admin/branding" replace />} />
                </Route>
                {/* Dentist routes with new sidebar - dynamically get user */}
                <Route path="/dentist/*" element={<DentistRoutesWrapper />} />
                {/* Patient portal routes with patient nav */}
                <Route element={<PatientPortalNav><></></PatientPortalNav>}>
                  <Route path="/care" element={<PatientCareHome />} />
                  <Route path="/care/appointments" element={<PatientAppointmentsPage />} />
                  <Route path="/care/prescriptions" element={<PatientPrescriptionsPage />} />
                  <Route path="/care/history" element={<PatientTreatmentHistoryPage />} />
                  <Route path="/billing" element={<PatientBillingPage />} />
                  <Route path="/docs" element={<PatientDocumentsPage />} />
                  <Route path="/account/profile" element={<PatientAccountProfilePage />} />
                  <Route path="/account/insurance" element={<PatientAccountInsurancePage />} />
                  <Route path="/account/privacy" element={<PatientAccountPrivacyPage />} />
                  <Route path="/account/help" element={<PatientAccountHelpPage />} />
                </Route>
                {/* Auth routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                {/* Public routes */}
                <Route path="/emergency-triage" element={<EmergencyTriage />} />
                <Route path="/dentists" element={<DentistProfiles />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/about" element={<About />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/payment-cancelled" element={<PaymentCancelled />} />
                <Route path="/support" element={<Support />} />
                <Route path="/features/:id" element={<FeatureDetail />} />
                <Route path="/language-test" element={<LanguageTest />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/invite" element={<Invite />} />
                <Route path="/claim" element={<Claim />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
