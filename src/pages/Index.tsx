import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Dashboard } from "@/components/Dashboard";
import { CalendarView } from "@/components/CalendarView";
import { DentalChatbot } from "@/components/DentalChatbot";
import { AppointmentsList } from "@/components/AppointmentsList";
import { AuthForm } from "@/components/AuthForm";
import { LanguageSettings } from "@/components/LanguageSettings";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Activity, LogOut, User as UserIcon } from "lucide-react";
import { Session, User } from "@supabase/supabase-js";
import { useLanguage } from "@/hooks/useLanguage";
import { Routes, Route, Navigate } from "react-router-dom";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/30 border-t-primary mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Activity className="w-8 h-8 text-primary animate-pulse" />
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
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12 space-y-6">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="bg-primary p-4 rounded-2xl shadow-lg">
                  <Activity className="h-16 w-16 text-primary-foreground" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-secondary rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl font-bold text-primary">
                SmileCare AI
              </h1>
              <p className="text-2xl text-primary font-semibold">
                Your Intelligent Dental Assistant 24/7
              </p>
              <p className="text-muted-foreground max-w-3xl mx-auto text-lg leading-relaxed">
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
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-6">
            <SidebarTrigger className="mr-4" />
            <div className="flex items-center space-x-4 flex-1">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="bg-primary p-2 rounded-xl">
                    <Activity className="h-6 w-6 text-primary-foreground" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-primary">SmileCare AI</h1>
                  <Badge variant="secondary" className="text-xs">Online</Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <UserIcon className="h-4 w-4" />
                <span className="max-w-[150px] truncate">{user.email}</span>
              </div>
              <ThemeToggle />
              <LanguageSettings />
              <Separator orientation="vertical" className="h-6" />
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                {t.signOut || 'Sign Out'}
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard user={user} />} />
              <Route path="/chat" element={<DentalChatbot user={user} />} />
              <Route path="/appointments" element={<CalendarView user={user} />} />
              <Route path="/history" element={<AppointmentsList user={user} />} />
              <Route path="/records" element={
                <div className="text-center py-12">
                  <h1 className="text-2xl font-bold mb-4">Health Records</h1>
                  <p className="text-muted-foreground">Coming Soon - Track your dental health history</p>
                </div>
              } />
              <Route path="/analytics" element={
                <div className="text-center py-12">
                  <h1 className="text-2xl font-bold mb-4">Analytics</h1>
                  <p className="text-muted-foreground">Coming Soon - View your dental health insights</p>
                </div>
              } />
              <Route path="/profile" element={
                <div className="text-center py-12">
                  <h1 className="text-2xl font-bold mb-4">Profile</h1>
                  <p className="text-muted-foreground">Coming Soon - Manage your profile settings</p>
                </div>
              } />
              <Route path="/settings" element={
                <div className="text-center py-12">
                  <h1 className="text-2xl font-bold mb-4">Settings</h1>
                  <p className="text-muted-foreground">Coming Soon - Customize your preferences</p>
                </div>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;