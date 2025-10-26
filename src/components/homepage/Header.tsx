import { useState, useEffect } from "react";
import { AppButton } from "@/components/ui/AppButton";
import { ProgressiveAuthForm } from "@/components/ProgressiveAuthForm";
import { LanguageSelector } from "@/components/LanguageSelector";
import { User } from "@supabase/supabase-js";
import { Stethoscope, Menu, X, Calendar, Activity, BarChart3, Settings, Phone, LogOut, User as UserIcon } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useClinicBranding } from "@/hooks/useClinicBranding";
import { BusinessSelector } from "@/components/BusinessSelector";
import { RoleSwitcher } from "@/components/RoleSwitcher";
interface HeaderProps {
  user: User | null;
  minimal?: boolean;
}
export const Header = ({
  user,
  minimal = false
}: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const {
    language,
    t
  } = useLanguage();
  const {
    toast
  } = useToast();
  const {
    branding
  } = useClinicBranding();
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account"
      });
      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive"
      });
    }
  };
  const navigation = [{
    name: language === 'fr' ? "Triage d'urgence" : language === 'nl' ? 'Spoed Triage' : 'Emergency Triage',
    href: '/emergency-triage',
    icon: Activity
  }, {
    name: language === 'fr' ? 'Agenda' : language === 'nl' ? 'Agenda' : 'Schedule',
    href: '/schedule',
    icon: Calendar
  }, {
    name: language === 'fr' ? 'Analyses' : language === 'nl' ? 'Analytics' : 'Analytics',
    href: '/analytics',
    icon: BarChart3
  }, {
    name: language === 'fr' ? 'Assistance' : language === 'nl' ? 'Support' : 'Support',
    href: '/support',
    icon: Phone
  }];
  return <header className="glass-card sticky top-0 z-50 border-0 border-b border-white/10">
      <TooltipProvider>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4 lg:py-6">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              {branding.logoUrl ? <img src={branding.logoUrl} alt={branding.clinicName || "Clinic Logo"} className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl object-cover shadow-glow" /> : <>
                  <div className="pulse-ring w-12 h-12 -top-3 -left-3 lg:w-16 lg:h-16 lg:-top-4 lg:-left-4"></div>
                  <div className="relative p-2 lg:p-3 rounded-2xl shadow-glow animate-glow bg-white">
                    <Stethoscope className="h-5 w-5 lg:h-7 lg:w-7 text-dental-primary" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-secondary rounded-full animate-pulse shadow-float"></div>
                </>}
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl lg:text-2xl font-bold gradient-text">
                {branding.clinicName || "Denti Bot Unified"}
              </h1>
              <p className="text-xs lg:text-sm text-dental-muted-foreground">
                {language === 'fr' ? "Plateforme de soins dentaires propulsée par l'IA" : language === 'nl' ? "Door AI aangedreven tandheelkundig platform" : 'AI-Powered Dental Care Platform'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          {!minimal && <nav className="hidden lg:flex items-center space-x-8">
              {navigation.map(item => <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <a href={item.href} className="flex items-center space-x-2 text-dental-muted-foreground hover:text-dental-primary transition-colors duration-300 font-medium">
                      <item.icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{item.name}</p>
                  </TooltipContent>
                </Tooltip>)}
            </nav>}

          {/* Auth Section */}
          <div className="flex items-center gap-3">
            {user && (
              <>
                <BusinessSelector />
                <RoleSwitcher />
              </>
            )}
            <LanguageSelector />
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && !minimal && <div className="lg:hidden py-4 border-t border-white/10">
            <nav className="space-y-4">
              {navigation.map(item => <a key={item.name} href={item.href} className="flex items-center space-x-3 text-dental-muted-foreground hover:text-dental-primary transition-colors duration-300 font-medium py-2" onClick={() => setIsMobileMenuOpen(false)}>
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </a>)}
              {/* Mobile Language Selector - Always visible */}
              <div className="pt-4 border-t border-white/10">
                <LanguageSelector />
              </div>
              
              {!user && <div className="pt-4 border-t border-white/10">
                  <ProgressiveAuthForm />
                </div>}
            </nav>
          </div>}
      </div>
      </TooltipProvider>
    </header>;
};