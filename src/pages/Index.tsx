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
import { DatabaseTest } from "@/components/DatabaseTest";
import { Card } from "@/components/ui/card";
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
    return (
      <div className="min-h-screen flex items-center justify-center mesh-bg">
        <div className="text-center space-y-8 animate-fade-in">
          <div className="relative">
            {/* Enhanced pulse rings */}
            <div className="pulse-ring w-40 h-40 -top-10 -left-10"></div>
            <div className="pulse-ring-secondary w-32 h-32 -top-6 -left-6"></div>
            
            {/* Enhanced main card */}
            <Card 
              variant="glass-strong" 
              className="relative p-8 rounded-3xl shadow-glow animate-float border-dental-primary/20"
            >
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto shadow-elegant">
                <Stethoscope className="w-8 h-8 text-white" />
              </div>
            </Card>
          </div>
          
          <div className="space-y-6">
            <h1 className="text-4xl font-bold gradient-text animate-slide-up">
              Denti Bot Unified
            </h1>
            
            <p className="text-2xl font-semibold text-dental-primary animate-slide-up" style={{ animationDelay: "0.2s" }}>
              {t.initializingExperience}
            </p>
            
            <p className="text-dental-muted-foreground max-w-md mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: "0.4s" }}>
              {t.preparingAssistant}
            </p>
            
            {/* Enhanced loading dots */}
            <div className="flex justify-center animate-fade-in" style={{ animationDelay: "0.6s" }}>
              <div className="flex space-x-3">
                <div className="w-3 h-3 bg-gradient-primary rounded-full animate-bounce shadow-soft"></div>
                <div className="w-3 h-3 bg-gradient-primary rounded-full animate-bounce shadow-soft" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-3 h-3 bg-gradient-primary rounded-full animate-bounce shadow-soft" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
            
            {/* Progress indicator */}
            <div className="w-64 mx-auto">
              <div className="w-full bg-dental-muted/20 rounded-full h-2 animate-fade-in" style={{ animationDelay: "0.8s" }}>
                <div className="bg-gradient-primary h-2 rounded-full animate-pulse" style={{ width: "75%" }}></div>
              </div>
              <p className="text-xs text-dental-muted-foreground mt-2 animate-fade-in" style={{ animationDelay: "1.0s" }}>
                Setting up your personalized experience...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is authenticated, show the dashboard
  if (user) {
    // For testing purposes, show the database test component
    if (window.location.search.includes('test=database')) {
      return <DatabaseTest />;
    }
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