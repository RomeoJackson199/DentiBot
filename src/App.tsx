import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "./hooks/useLanguage";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import DentistProfiles from "./pages/DentistProfiles";
import { DentistDashboard } from "./pages/DentistDashboard";
import { DentistAgenda } from "./pages/DentistAgenda";
import { DentistPatients } from "./pages/DentistPatients";
import { DentistCreateAppointment } from "./pages/DentistCreateAppointment";
import { DentistLayout } from "./components/DentistLayout";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

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
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dentists" element={<DentistProfiles />} />
                <Route path="/dashboard" element={
                  <DentistLayout>
                    {(user) => <DentistDashboard user={user} />}
                  </DentistLayout>
                } />
                <Route path="/agenda" element={
                  <DentistLayout>
                    {(user) => <DentistAgenda user={user} />}
                  </DentistLayout>
                } />
                <Route path="/patients" element={
                  <DentistLayout>
                    {(user) => <DentistPatients user={user} />}
                  </DentistLayout>
                } />
                <Route path="/appointments/create" element={
                  <DentistLayout>
                    {(user) => <DentistCreateAppointment user={user} />}
                  </DentistLayout>
                } />
                <Route path="/terms" element={<Terms />} />
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
