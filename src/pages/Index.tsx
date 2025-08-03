import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { UnifiedDashboard } from "@/components/UnifiedDashboard";
import { AuthForm } from "@/components/AuthForm";
import { OnboardingPopup } from "@/components/OnboardingPopup";
import { LanguageSelection } from "@/components/LanguageSelection";
import { Header } from "@/components/homepage/Header";
import { HeroSection } from "@/components/homepage/HeroSection";
import { FeatureCards } from "@/components/homepage/FeatureCards";
import { StatsSection } from "@/components/homepage/StatsSection";
import { Footer } from "@/components/homepage/Footer";
import { AppointmentBookingWithAuth } from "@/components/AppointmentBookingWithAuth";
import { EmergencyTriageForm } from "@/components/EmergencyTriageForm";
import { FloatingEmergencyButton } from "@/components/FloatingEmergencyButton";
import { useToast } from "@/hooks/use-toast";
import { Stethoscope } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { createDossierAfterSignup } from "@/lib/medicalRecords";
const Index = () => {
  const {
    t,
    setLanguage
  } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLanguageSelection, setShowLanguageSelection] = useState(false);
  const [showAppointmentBooking, setShowAppointmentBooking] = useState(false);
  const [showEmergencyTriage, setShowEmergencyTriage] = useState(false);
  const {
    toast
  } = useToast();

  // Auto-detect language based on browser locale
  useEffect(() => {
    const detectLanguage = () => {
      const savedLanguage = localStorage.getItem('preferred-language');
      if (!savedLanguage) {
        const browserLang = navigator.language.toLowerCase();
        if (browserLang.startsWith('fr')) {
          setLanguage('fr');
          localStorage.setItem('preferred-language', 'fr');
        } else if (browserLang.startsWith('nl')) {
          setLanguage('nl');
          localStorage.setItem('preferred-language', 'nl');
        } else {
          setLanguage('en');
          localStorage.setItem('preferred-language', 'en');
        }
      }
    };
    detectLanguage();
  }, [setLanguage]);
  useEffect(() => {
    // Set up auth state listener
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Use setTimeout to defer async operations and prevent deadlocks
      if (event === 'SIGNED_IN' && session?.user) {
        setTimeout(() => {
          const hasSeenOnboarding = localStorage.getItem(`onboarding_${session.user.id}`);
          if (!hasSeenOnboarding) {
            setShowOnboarding(true);
          }

          // Create initial dossier for new users
          createDossierAfterSignup(session.user.id).catch(console.error);
        }, 0);
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Check onboarding for existing session
      if (session?.user) {
        const hasSeenOnboarding = localStorage.getItem(`onboarding_${session.user.id}`);
        if (!hasSeenOnboarding) {
          setShowOnboarding(true);
        }
      }
    }).catch(error => {
      console.error('Error getting session:', error);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);
  const handleLanguageSelected = () => {
    setShowLanguageSelection(false);
    const hasSeenOnboarding = user ? localStorage.getItem(`onboarding_${user.id}`) : null;
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  };
  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    if (user) {
      localStorage.setItem(`onboarding_${user.id}`, 'true');
    }
    toast({
      description: t.aiDisclaimer
    });
  };

  const handleAppointmentComplete = () => {
    setShowAppointmentBooking(false);
    toast({
      title: "Appointment Booked",
      description: "Your appointment has been successfully scheduled.",
    });
  };

  const handleTriageComplete = () => {
    setShowEmergencyTriage(false);
    toast({
      title: "Triage Complete",
      description: "Your emergency assessment has been completed.",
    });
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center mesh-bg">
        <div className="text-center space-y-8 animate-fade-in">
          <div className="relative">
            <div className="pulse-ring w-32 h-32 -top-8 -left-8"></div>
            <div className="relative p-6 rounded-3xl shadow-glow animate-float bg-white">
              <Stethoscope className="w-12 h-12 text-dental-primary mx-auto" />
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-bold gradient-text">Denti Bot Unified</h1>
            <p className="text-xl font-semibold text-dental-primary">{t.initializingExperience}</p>
            <p className="text-dental-muted-foreground max-w-md mx-auto">
              {t.preparingAssistant}
            </p>
            <div className="flex justify-center">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-dental-primary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-dental-primary rounded-full animate-bounce" style={{
                animationDelay: "0.1s"
              }}></div>
                <div className="w-2 h-2 bg-dental-primary rounded-full animate-bounce" style={{
                animationDelay: "0.2s"
              }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>;
  }

  // If user is authenticated, show the dashboard
  if (user) {
    return <UnifiedDashboard user={user} />;
  }

  // Show appointment booking modal
  if (showAppointmentBooking) {
    return (
      <AppointmentBookingWithAuth
        user={user}
        onComplete={handleAppointmentComplete}
        onCancel={() => setShowAppointmentBooking(false)}
      />
    );
  }

  // Show emergency triage modal
  if (showEmergencyTriage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-4">
        <div className="max-w-4xl mx-auto">
          <EmergencyTriageForm
            onComplete={handleTriageComplete}
            onCancel={() => setShowEmergencyTriage(false)}
          />
        </div>
      </div>
    );
  }

  // Show the new professional homepage for non-authenticated users
  return <div className="min-h-screen mesh-bg">
      <Header user={user} />
      <HeroSection
        onBookAppointment={() => setShowAppointmentBooking(true)}
        onStartTriage={() => setShowEmergencyTriage(true)}
      />
      <FeatureCards />
      <StatsSection />

      {/* Footer CTA Section */}
      <section className="py-20 border-t border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-2xl mx-auto space-y-8">
            <h2 className="text-3xl sm:text-4xl font-bold gradient-text">
              Ready to Transform Your Practice?
            </h2>
            <p className="text-xl text-dental-muted-foreground">
              Join thousands of dental professionals who have revolutionized patient care with AI.
            </p>
            <div className="space-y-4">
              <AuthForm />
              
            </div>
          </div>
        </div>
      </section>

      {/* Floating Emergency Button */}
      <FloatingEmergencyButton onEmergencyClick={() => setShowEmergencyTriage(true)} />

      <Footer />

      {/* Language Selection Modal */}
      {showLanguageSelection && <LanguageSelection onLanguageSelected={handleLanguageSelected} />}

      {/* Onboarding Popup */}
      <OnboardingPopup isOpen={showOnboarding} onClose={handleOnboardingClose} />
    </div>;
};
export default Index;