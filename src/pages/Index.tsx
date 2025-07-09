import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { DentalChatbot } from "@/components/DentalChatbot";
import { AuthForm } from "@/components/AuthForm";
import { useToast } from "@/hooks/use-toast";
import { Activity, User as UserIcon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
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
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
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
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="bg-gradient-primary p-3 rounded-xl shadow-glow">
                <Activity className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-dental-secondary rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                SmileCare AI
              </h1>
              <p className="text-dental-muted-foreground font-medium">Intelligent Dental Assistant</p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center text-sm text-dental-primary font-medium">
              <UserIcon className="h-4 w-4 mr-2" />
              {user.email}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              className="flex items-center bg-muted hover:bg-dental-primary/10 border-dental-primary/20 text-dental-primary hover:text-dental-primary transition-all duration-300"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <DentalChatbot user={user} />
      </main>
    </div>
  );
};

export default Index;
