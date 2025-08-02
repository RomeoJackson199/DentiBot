import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { UnifiedDashboard } from "@/components/UnifiedDashboard";
import { AuthForm } from "@/components/AuthForm";
import { OnboardingPopup } from "@/components/OnboardingPopup";
import { LanguageSelection } from "@/components/LanguageSelection";
import { useToast } from "@/hooks/use-toast";
import { Stethoscope, MessageSquare, Calendar } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { createDossierAfterSignup } from "@/lib/medicalRecords";

const Index = () => {
  const { t, setLanguage } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLanguageSelection, setShowLanguageSelection] = useState(false);
  const { toast } = useToast();

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
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
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
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
    toast({ description: t.aiDisclaimer });
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center mesh-bg">
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
                <div className="w-2 h-2 bg-dental-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-dental-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show main app with login button in corner (no auth required for chat)

  return (
    <div className="min-h-screen mesh-bg">
      <header className="glass-card sticky top-0 z-50 border-0 border-b border-border/20">
        <div className="container mx-auto px-4 py-4 sm:py-6 flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="relative">
              <div className="pulse-ring w-16 h-16 -top-4 -left-4 sm:w-20 sm:h-20 sm:-top-5 sm:-left-5"></div>
              <div className="relative p-2 sm:p-3 rounded-2xl shadow-glow animate-glow bg-white">
                <Stethoscope className="h-6 w-6 sm:h-8 sm:w-8 text-dental-primary" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-secondary rounded-full animate-pulse shadow-float"></div>
            </div>
            <div className="hidden sm:block">
              <h2 className="text-2xl font-bold gradient-text">Denti Bot Unified</h2>
              <p className="text-sm text-dental-muted-foreground">AI-Powered Dental Care Platform</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {!user && <AuthForm compact />}
          </div>
        </div>
      </header>

      {/* Main Content */}
      {user ? (
        <UnifiedDashboard user={user} />
      ) : (
        <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 lg:py-10">
          <div className="text-center py-12 space-y-8">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="relative">
                <div className="pulse-ring w-32 h-32 -top-8 -left-8 mx-auto"></div>
                <div className="relative p-6 rounded-3xl shadow-glow animate-float bg-white mx-auto w-fit">
                  <Stethoscope className="w-12 h-12 text-dental-primary mx-auto" />
                </div>
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-bold gradient-text">
                Denti Bot Unified
              </h1>
              
              <p className="text-xl text-dental-muted-foreground">
                AI-Powered Emergency Triage & Dental Care Platform
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
                <div className="glass-card p-6 rounded-2xl text-center space-y-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto">
                    <Stethoscope className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold">Emergency Triage</h3>
                  <p className="text-sm text-dental-muted-foreground">
                    Assess urgency in 1 minute for tailored appointments
                  </p>
                </div>
                
                <div className="glass-card p-6 rounded-2xl text-center space-y-4">
                  <div className="w-12 h-12 bg-gradient-secondary rounded-xl flex items-center justify-center mx-auto">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold">AI Assistant</h3>
                  <p className="text-sm text-dental-muted-foreground">
                    24/7 intelligent dental consultation
                  </p>
                </div>
                
                <div className="glass-card p-6 rounded-2xl text-center space-y-4">
                  <div className="w-12 h-12 bg-gradient-accent rounded-xl flex items-center justify-center mx-auto">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold">Smart Booking</h3>
                  <p className="text-sm text-dental-muted-foreground">
                    Automatic scheduling based on urgency
                  </p>
                </div>
              </div>
              
              <div className="pt-8">
                <AuthForm />
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Language Selection */}
      {showLanguageSelection && (
        <LanguageSelection onLanguageSelected={handleLanguageSelected} />
      )}

      {/* Onboarding Popup */}
      <OnboardingPopup 
        isOpen={showOnboarding} 
        onClose={handleOnboardingClose}
      />
    </div>
  );
};

export default Index;
