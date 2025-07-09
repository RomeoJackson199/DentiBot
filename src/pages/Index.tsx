import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { DentalChatbot } from "@/components/DentalChatbot";
import { AuthForm } from "@/components/AuthForm";
import { AppointmentsList } from "@/components/AppointmentsList";
import { useToast } from "@/hooks/use-toast";
import { Activity, User as UserIcon, LogOut, MessageSquare, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSettings } from "@/components/LanguageSettings";
import { useLanguage } from "@/hooks/useLanguage";

const Index = () => {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'appointments'>('chat');
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-card">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-dental-primary/30 border-t-dental-primary mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Activity className="w-8 h-8 text-dental-primary animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xl font-semibold text-foreground">Initializing SmileCare AI</p>
            <p className="text-muted-foreground">Preparing your personalized dental experience...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-card">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12 space-y-6">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="bg-gradient-primary p-4 rounded-2xl shadow-glow">
                  <Activity className="h-16 w-16 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-dental-secondary rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                SmileCare AI
              </h1>
              <p className="text-2xl text-dental-primary font-semibold">
                Your Intelligent Dental Assistant 24/7
              </p>
              <p className="text-dental-muted-foreground max-w-3xl mx-auto text-lg leading-relaxed">
                Book appointments, assess the urgency of your situation, and receive personalized advice 
                with our specialized dental care chatbot powered by advanced AI technology.
              </p>
            </div>
          </div>
          <AuthForm />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-card">
      <header className="bg-card/80 backdrop-blur-lg shadow-card border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 sm:py-6 flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="relative">
              <div className="bg-gradient-primary p-2 sm:p-3 rounded-xl shadow-glow">
                <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-dental-secondary rounded-full animate-pulse"></div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                SmileCare AI
              </h1>
              <p className="text-dental-muted-foreground font-medium text-sm">Intelligent Dental Assistant</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="hidden md:flex items-center text-sm text-dental-primary font-medium">
              <UserIcon className="h-4 w-4 mr-2" />
              <span className="max-w-[120px] sm:max-w-none truncate">{user.email}</span>
            </div>
            <LanguageSettings />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              className="flex items-center bg-muted hover:bg-dental-primary/10 border-dental-primary/20 text-dental-primary hover:text-dental-primary transition-all duration-300"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t.signOut}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-8">
        {/* Tab Navigation */}
        <div className="flex justify-center mb-6">
          <div className="bg-card/80 backdrop-blur-lg rounded-xl p-2 shadow-card border border-border/50">
            <div className="flex space-x-2">
              <Button
                variant={activeTab === 'chat' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('chat')}
                className={`flex items-center space-x-2 transition-all duration-300 ${
                  activeTab === 'chat' 
                    ? 'bg-gradient-primary text-white shadow-elegant' 
                    : 'text-dental-muted-foreground hover:text-dental-primary hover:bg-dental-primary/10'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Chat Assistant</span>
              </Button>
              <Button
                variant={activeTab === 'appointments' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('appointments')}
                className={`flex items-center space-x-2 transition-all duration-300 ${
                  activeTab === 'appointments' 
                    ? 'bg-gradient-primary text-white shadow-elegant' 
                    : 'text-dental-muted-foreground hover:text-dental-primary hover:bg-dental-primary/10'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span>Mes Rendez-vous</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'chat' ? (
          <DentalChatbot user={user} />
        ) : (
          <AppointmentsList user={user} />
        )}
      </main>
    </div>
  );
};

export default Index;
