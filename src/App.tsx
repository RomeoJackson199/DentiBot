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
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { SeoManager } from "./lib/seo";
import { LazyLoadingWrapper } from "./components/optimized/LazyLoadingWrapper";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const DentistProfiles = lazy(() => import("./pages/DentistProfiles"));
const Terms = lazy(() => import("./pages/Terms"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const NotFound = lazy(() => import("./pages/NotFound"));
const EmergencyTriage = lazy(() => import("./pages/EmergencyTriage"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess").then(module => ({ default: module.PaymentSuccess })));
const PaymentCancelled = lazy(() => import("./pages/PaymentCancelled").then(module => ({ default: module.PaymentCancelled })));
const Chat = lazy(() => import("./pages/Chat"));
const Schedule = lazy(() => import("./pages/Schedule"));
const RecallDeepLink = lazy(() => import("./pages/RecallDeepLink"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Support = lazy(() => import("./pages/Support"));
const FeatureDetail = lazy(() => import("./pages/FeatureDetail"));
const UnifiedDashboard = lazy(() => import("./components/UnifiedDashboard").then(module => ({ default: module.UnifiedDashboard })));
const LanguageTest = lazy(() => import("./components/LanguageTest").then(module => ({ default: module.LanguageTest })));
const Importer = lazy(() => import("./pages/Importer"));

// Dashboard component that handles authentication with lazy loading
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

  return (
    <UnifiedDashboard user={user} />
  );
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry auth errors
        if (error && typeof error === 'object' && 'code' in error) {
          const supabaseError = error as { code?: string };
          if (supabaseError.code === 'PGRST301' || supabaseError.code === 'PGRST116') {
            return false;
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
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <PWAInstallPrompt />
              <ProfileCompletionDialog />
              <BrowserRouter>
                <SeoManager />
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
                <Route path="/recalls/:id" element={<RecallDeepLink />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/support" element={<Support />} />
                <Route path="/importer" element={<Importer />} />
                <Route path="/features/:id" element={<FeatureDetail />} />
                <Route path="/language-test" element={<LanguageTest />} />
                <Route path="/chat" element={<Chat />} />
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
