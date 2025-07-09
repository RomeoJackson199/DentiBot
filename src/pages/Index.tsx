import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { DentalChatbot } from "@/components/DentalChatbot";
import { AuthForm } from "@/components/AuthForm";
import { OnboardingPopup } from "@/components/OnboardingPopup";
import { AppointmentsList } from "@/components/AppointmentsList";
import { useToast } from "@/hooks/use-toast";
import { Activity, User as UserIcon, LogOut, MessageSquare, Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSettings } from "@/components/LanguageSettings";
import { useLanguage } from "@/hooks/useLanguage";
import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'appointments'>('chat');
  const [triggerBooking, setTriggerBooking] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Show onboarding for new users
        if (event === 'SIGNED_IN' && session?.user) {
          const hasSeenOnboarding = localStorage.getItem(`onboarding_${session.user.id}`);
          if (!hasSeenOnboarding) {
            setShowOnboarding(true);
          }
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
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Error during sign out",
        variant: "destructive",
      });
    } else {
      toast({
        title: t.signOut,
        description: "You have been signed out successfully",
      });
    }
  };

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    if (user) {
      localStorage.setItem(`onboarding_${user.id}`, 'true');
    }
  };

  const handleBookAppointment = () => {
    setActiveTab('chat');
    setTriggerBooking(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center mesh-bg">
        <div className="text-center space-y-8 animate-fade-in">
          <div className="relative">
            <div className="pulse-ring w-32 h-32 -top-8 -left-8"></div>
            <div className="relative bg-gradient-primary p-6 rounded-3xl shadow-glow animate-float">
              <Activity className="w-12 h-12 text-white" />
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-bold gradient-text">SmileCare AI</h1>
            <p className="text-xl font-semibold text-dental-primary">Initializing your experience</p>
            <p className="text-dental-muted-foreground max-w-md mx-auto">
              Preparing your personalized dental assistant powered by advanced AI technology
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

  if (!user) {
    return (
      <div className="min-h-screen hero-pattern">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16 space-y-8 animate-fade-in">
            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <div className="pulse-ring w-24 h-24 -top-6 -left-6"></div>
                <div className="relative bg-gradient-primary p-6 rounded-3xl shadow-glow animate-float">
                  <Activity className="h-20 w-20 text-white" />
                </div>
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-secondary rounded-full animate-pulse shadow-float"></div>
              </div>
            </div>
            <div className="space-y-6">
              <h1 className="text-6xl md:text-7xl font-bold gradient-text leading-tight">
                SmileCare AI
              </h1>
              <div className="space-y-4">
                <p className="text-3xl text-dental-primary font-semibold animate-slide-in">
                  Your Intelligent Dental Assistant 24/7
                </p>
                <div className="flex justify-center">
                  <div className="h-1 w-24 bg-gradient-primary rounded-full"></div>
                </div>
              </div>
              <p className="text-dental-muted-foreground max-w-4xl mx-auto text-xl leading-relaxed animate-fade-in" style={{ animationDelay: "0.3s" }}>
                Experience the future of dental care with AI-powered consultations, smart appointment booking, 
                and personalized treatment recommendations. Available 24/7 to help you maintain your perfect smile.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-12">
                <div className="floating-card p-6 text-center animate-scale-in" style={{ animationDelay: "0.5s" }}>
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-dental-primary mb-2">AI Diagnosis</h3>
                  <p className="text-sm text-dental-muted-foreground">Get instant AI-powered assessments</p>
                </div>
                <div className="floating-card p-6 text-center animate-scale-in" style={{ animationDelay: "0.7s" }}>
                  <div className="w-12 h-12 bg-gradient-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-dental-primary mb-2">Smart Booking</h3>
                  <p className="text-sm text-dental-muted-foreground">Book appointments intelligently</p>
                </div>
                <div className="floating-card p-6 text-center animate-scale-in" style={{ animationDelay: "0.9s" }}>
                  <div className="w-12 h-12 bg-gradient-accent rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-dental-primary mb-2">24/7 Support</h3>
                  <p className="text-sm text-dental-muted-foreground">Round-the-clock assistance</p>
                </div>
              </div>
            </div>
          </div>
          <div className="max-w-md mx-auto animate-fade-in" style={{ animationDelay: "1.1s" }}>
            <AuthForm />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mesh-bg">
      <header className="glass-card sticky top-0 z-50 border-0 border-b border-border/20">
        <div className="container mx-auto px-4 py-4 sm:py-6 flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="relative">
              <div className="pulse-ring w-16 h-16 -top-4 -left-4 sm:w-20 sm:h-20 sm:-top-5 sm:-left-5"></div>
              <div className="relative bg-gradient-primary p-2 sm:p-3 rounded-2xl shadow-glow animate-glow">
                <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-secondary rounded-full animate-pulse shadow-float"></div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl sm:text-2xl font-bold gradient-text">
                SmileCare AI
              </h1>
              <p className="text-dental-muted-foreground font-medium text-sm">Intelligent Dental Assistant</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="hidden md:flex items-center text-sm text-dental-primary font-medium floating-card px-3 py-1.5 rounded-full">
              <UserIcon className="h-4 w-4 mr-2" />
              <span className="max-w-[120px] sm:max-w-none truncate">{user.email}</span>
            </div>
            <ThemeToggle />
            <LanguageSettings />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              className="glass-card border-dental-primary/30 text-dental-primary hover:bg-dental-primary/10 hover:border-dental-primary/50 transition-all duration-300"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t.signOut}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 lg:py-10">
        {/* Tab Navigation */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="glass-card rounded-2xl p-2 sm:p-3 animate-fade-in w-full max-w-md">
            <div className="flex space-x-2 sm:space-x-3">
              <Button
                variant={activeTab === 'chat' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('chat')}
                className={`flex items-center space-x-2 sm:space-x-3 px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all duration-300 flex-1 justify-center ${
                  activeTab === 'chat' 
                    ? 'bg-gradient-primary text-white shadow-elegant scale-105' 
                    : 'text-dental-muted-foreground hover:text-dental-primary hover:bg-dental-primary/10 hover:scale-105'
                }`}
              >
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="font-medium text-sm sm:text-base">Chat</span>
              </Button>
              <div className="flex items-center space-x-2 flex-1">
                <Button
                  variant={activeTab === 'appointments' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('appointments')}
                  className={`flex items-center space-x-2 sm:space-x-3 px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all duration-300 flex-1 justify-center ${
                    activeTab === 'appointments' 
                      ? 'bg-gradient-primary text-white shadow-elegant scale-105' 
                      : 'text-dental-muted-foreground hover:text-dental-primary hover:bg-dental-primary/10 hover:scale-105'
                  }`}
                >
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="font-medium text-sm sm:text-base">Rendez-vous</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBookAppointment}
                  className="shrink-0 glass-card border-dental-primary/30 text-dental-primary hover:bg-dental-primary/10 hover:scale-105 transition-all duration-300 w-8 h-8 sm:w-10 sm:h-10 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="animate-fade-in">
          {activeTab === 'chat' ? (
            <DentalChatbot 
              user={user} 
              triggerBooking={triggerBooking} 
              onBookingTriggered={() => setTriggerBooking(false)} 
            />
          ) : (
            <AppointmentsList user={user} />
          )}
        </div>
      </main>

      {/* Onboarding Popup */}
      <OnboardingPopup 
        isOpen={showOnboarding} 
        onClose={handleOnboardingClose}
      />
    </div>
  );
};

export default Index;
