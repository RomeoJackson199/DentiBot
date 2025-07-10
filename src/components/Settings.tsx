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
  DialogTrigger,
  DialogDescription 
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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

export const Settings = ({ user }: SettingsProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-dental-primary">
            <SettingsIcon className="h-5 w-5" />
            <span>Settings</span>
          </DialogTitle>
          <DialogDescription>
            Manage your account preferences and settings
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* User Information */}
          <Card className="glass-card border-dental-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center space-x-2 text-dental-primary">
                <UserIcon className="h-4 w-4" />
                <span>Account Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center space-x-3 p-3 bg-dental-primary/5 rounded-lg">
                <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-dental-primary">Email Address</p>
                  <p className="text-sm text-dental-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card className="glass-card border-dental-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center space-x-2 text-dental-primary">
                <Palette className="h-4 w-4" />
                <span>Appearance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="flex items-center justify-between p-3 bg-dental-primary/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-secondary rounded-lg flex items-center justify-center">
                    <Sun className="h-4 w-4 text-white dark:hidden" />
                    <Moon className="h-4 w-4 text-white hidden dark:block" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-dental-primary">Theme</p>
                    <p className="text-xs text-dental-muted-foreground">Switch between light and dark mode</p>
                  </div>
                </div>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>

          {/* Language Settings */}
          <Card className="glass-card border-dental-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center space-x-2 text-dental-primary">
                <Globe className="h-4 w-4" />
                <span>Language & Region</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between p-3 bg-dental-primary/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-accent rounded-lg flex items-center justify-center">
                    <Globe className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-dental-primary">Language</p>
                    <p className="text-xs text-dental-muted-foreground">Choose your preferred language</p>
                  </div>
                </div>
                <LanguageSettings />
              </div>
            </CardContent>
          </Card>

          <Separator className="bg-dental-primary/20" />

          {/* Sign Out */}
          <div className="pt-2">
            <Button 
              variant="destructive" 
              onClick={handleSignOut}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-xl transition-all duration-300 hover:scale-105"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t.signOut}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};