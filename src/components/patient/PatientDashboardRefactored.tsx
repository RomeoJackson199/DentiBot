import React, { useState, useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Heart, 
  Calendar, 
  CreditCard,
  Bell
} from "lucide-react";

// Import new page components
import { HomePage } from "./pages/HomePage";
import { CarePage } from "./pages/CarePage";
import { AppointmentsPage } from "./pages/AppointmentsPage";
import { PaymentsPage } from "./pages/PaymentsPage";

// Import components
import { NotificationButton } from "@/components/NotificationButton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PatientDashboardRefactoredProps {
  user: User;
}

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  full_name?: string | null;
  avatar_url?: string | null;
  phone: string | null;
  date_of_birth: string | null;
  address: string | null;
  medical_history: any;
  insurance_info?: any;
  emergency_contact: any;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
  preferred_language?: string;
}

export const PatientDashboardRefactored: React.FC<PatientDashboardRefactoredProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState("home");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Responsive breakpoints
  const isMobile = useMediaQuery("(max-width: 599px)");
  const isTablet = useMediaQuery("(min-width: 600px) and (max-width: 1023px)");
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Profile fetch error:', error);
          throw error;
        }
        
        if (!data) {
          throw new Error('No profile found for this user');
        }
        
        setProfile({
          ...data,
          full_name: `${data.first_name} ${data.last_name}`.trim()
        });
      } catch (error: any) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Profile Error",
          description: error.message || "Failed to load your profile. Please try refreshing the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user.id, toast]);

  const navigationItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'care', label: 'Care', icon: Heart },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'payments', label: 'Payments', icon: CreditCard },
  ];

  // Add a function to handle tab changes from child components
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'Patient';

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Layout */}
      {isDesktop && (
        <div className="flex h-screen">
          {/* Left Sidebar Navigation */}
          <aside className="w-64 border-r bg-card flex flex-col">
            {/* Profile Header */}
            <div className="p-6 border-b">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback>{firstName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{profile?.full_name || 'Patient'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <NotificationButton userId={user.id} />
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
              <div className="space-y-1">
                {navigationItems.map((item) => (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3",
                      activeTab === item.id && "bg-secondary"
                    )}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                ))}
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="container max-w-7xl mx-auto p-6">
              {activeTab === 'home' && <HomePage user={user} profile={profile} onTabChange={handleTabChange} />}
              {activeTab === 'care' && <CarePage user={user} onTabChange={handleTabChange} />}
              {activeTab === 'appointments' && <AppointmentsPage user={user} onTabChange={handleTabChange} />}
              {activeTab === 'payments' && <PaymentsPage user={user} onTabChange={handleTabChange} />}
            </div>
          </main>
        </div>
      )}

      {/* Tablet Layout */}
      {isTablet && (
        <div className="flex h-screen">
          {/* Mini Sidebar */}
          <aside className="w-20 border-r bg-card flex flex-col">
            {/* Profile Avatar */}
            <div className="p-4 border-b flex justify-center">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback>{firstName[0]}</AvatarFallback>
              </Avatar>
            </div>

            {/* Navigation Icons */}
            <nav className="flex-1 p-2">
              <div className="space-y-2">
                {navigationItems.map((item) => (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "secondary" : "ghost"}
                    size="icon"
                    className={cn(
                      "w-full h-14",
                      activeTab === item.id && "bg-secondary"
                    )}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <item.icon className="h-5 w-5" />
                  </Button>
                ))}
              </div>
            </nav>

            {/* Notification Button */}
            <div className="p-4 border-t flex justify-center">
              <NotificationButton userId={user.id} />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="container max-w-4xl mx-auto p-6">
              {activeTab === 'home' && <HomePage user={user} profile={profile} onTabChange={handleTabChange} />}
              {activeTab === 'care' && <CarePage user={user} onTabChange={handleTabChange} />}
              {activeTab === 'appointments' && <AppointmentsPage user={user} onTabChange={handleTabChange} />}
              {activeTab === 'payments' && <PaymentsPage user={user} onTabChange={handleTabChange} />}
            </div>
          </main>
        </div>
      )}

      {/* Mobile Layout */}
      {isMobile && (
        <div className="flex flex-col h-screen">
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto pb-16">
            <div className="p-4">
              {activeTab === 'home' && <HomePage user={user} profile={profile} onTabChange={handleTabChange} />}
              {activeTab === 'care' && <CarePage user={user} onTabChange={handleTabChange} />}
              {activeTab === 'appointments' && <AppointmentsPage user={user} onTabChange={handleTabChange} />}
              {activeTab === 'payments' && <PaymentsPage user={user} onTabChange={handleTabChange} />}
            </div>
          </main>

          {/* Bottom Navigation */}
          <nav className="fixed bottom-0 left-0 right-0 bg-card border-t z-50">
            <div className="flex justify-around items-center h-16">
              {navigationItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex-col gap-1 h-full flex-1 rounded-none",
                    activeTab === item.id && "text-primary"
                  )}
                  onClick={() => setActiveTab(item.id)}
                >
                  <item.icon className={cn(
                    "h-5 w-5",
                    activeTab === item.id && "text-primary"
                  )} />
                  <span className="text-xs">{item.label}</span>
                </Button>
              ))}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
};