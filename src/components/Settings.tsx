import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LanguageSettings } from "@/components/LanguageSettings";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Settings as SettingsIcon, 
  LogOut, 
  User as UserIcon, 
  Sun,
  Moon,
  Globe,
  Heart
} from "lucide-react";

interface SettingsProps {
  user: User;
}

interface UserProfile {
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: string;
  medical_history: string;
}

type TabType = 'general' | 'theme' | 'personal';

export const Settings = ({ user }: SettingsProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [profile, setProfile] = useState<UserProfile>({
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    medical_history: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone, date_of_birth, medical_history')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setProfile({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone: data.phone || '',
          date_of_birth: data.date_of_birth || '',
          medical_history: data.medical_history || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

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

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          date_of_birth: profile.date_of_birth || null,
          medical_history: profile.medical_history
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Personal information saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save personal information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general' as TabType, label: 'General', icon: Globe },
    { id: 'theme' as TabType, label: 'Theme', icon: Sun },
    { id: 'personal' as TabType, label: 'Personal', icon: UserIcon },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="glass-card border-dental-primary/30 text-dental-primary hover:bg-dental-primary/10 hover:border-dental-primary/50 transition-all duration-300"
        >
          <SettingsIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 bg-background border-border">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center space-x-3 text-2xl text-primary">
            <SettingsIcon className="h-6 w-6" />
            <span>Settings</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-muted/30 rounded-xl p-1 mb-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 flex-1 justify-center ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-6 pb-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Preferred Language</h3>
                <div className="bg-muted/30 rounded-xl p-4">
                  <LanguageSettings />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'theme' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Theme</h3>
                <div className="flex space-x-4">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    onClick={() => setTheme('light')}
                    className={`flex-1 py-6 flex items-center justify-center space-x-3 rounded-xl ${
                      theme === 'light' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted/30 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Sun className="h-5 w-5" />
                    <span className="font-medium">Light</span>
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    onClick={() => setTheme('dark')}
                    className={`flex-1 py-6 flex items-center justify-center space-x-3 rounded-xl ${
                      theme === 'dark' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted/30 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Moon className="h-5 w-5" />
                    <span className="font-medium">Dark</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'personal' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-foreground font-medium">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="Enter your first name"
                    value={profile.first_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                    className="mt-2 bg-muted/30 border-border rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-foreground font-medium">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Enter your last name"
                    value={profile.last_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))}
                    className="mt-2 bg-muted/30 border-border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone" className="text-foreground font-medium">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="Enter your phone number"
                    value={profile.phone}
                    onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-2 bg-muted/30 border-border rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfBirth" className="text-foreground font-medium">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={profile.date_of_birth}
                    onChange={(e) => setProfile(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    className="mt-2 bg-muted/30 border-border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="medicalHistory" className="text-foreground font-medium flex items-center space-x-2">
                  <Heart className="h-4 w-4" />
                  <span>Medical History</span>
                </Label>
                <Textarea
                  id="medicalHistory"
                  placeholder="Enter relevant medical history, allergies, medications, etc."
                  value={profile.medical_history}
                  onChange={(e) => setProfile(prev => ({ ...prev, medical_history: e.target.value }))}
                  className="mt-2 bg-muted/30 border-border rounded-xl min-h-[120px] resize-none"
                />
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-4 rounded-xl"
              >
                {loading ? 'Saving...' : 'Save Personal Information'}
              </Button>

              <div className="pt-4 border-t border-border">
                <Button 
                  variant="destructive" 
                  onClick={handleSignOut}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-xl"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t.signOut}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};