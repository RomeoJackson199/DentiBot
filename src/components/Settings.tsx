import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSettings } from "@/components/LanguageSettings";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  Palette,
  Globe,
  Mail,
  Moon,
  Sun
} from "lucide-react";

interface SettingsProps {
  user: User;
}

type TabType = 'general' | 'theme' | 'personal';

export const Settings = ({ user }: SettingsProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('general');

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

  const tabs = [
    { id: 'general' as TabType, label: 'General', icon: Globe },
    { id: 'theme' as TabType, label: 'Theme', icon: Palette },
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
      <DialogContent className="sm:max-w-2xl max-h-[80vh] p-0 bg-background border-border">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center space-x-3 text-2xl text-foreground">
            <SettingsIcon className="h-6 w-6 text-primary" />
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
        <div className="px-6 pb-6 space-y-6">
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
                <h3 className="text-lg font-semibold text-foreground mb-4">Appearance</h3>
                <div className="bg-muted/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Sun className="h-5 w-5 text-primary dark:hidden" />
                        <Moon className="h-5 w-5 text-primary hidden dark:block" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Theme Mode</p>
                        <p className="text-sm text-muted-foreground">Switch between light and dark mode</p>
                      </div>
                    </div>
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'personal' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Account Information</h3>
                <div className="bg-muted/30 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">Email Address</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Account Actions</h3>
                <div className="bg-muted/30 rounded-xl p-4">
                  <Button 
                    variant="destructive" 
                    onClick={handleSignOut}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-lg transition-all duration-300"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t.signOut}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};