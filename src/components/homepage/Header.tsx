import { useState } from "react";
import { AppButton } from "@/components/ui/AppButton";
import { ProgressiveAuthForm } from "@/components/ProgressiveAuthForm";
import { LanguageSelector } from "@/components/LanguageSelector";
import { User } from "@supabase/supabase-js";
import { Stethoscope, Menu, X, Calendar, Activity, BarChart3, Settings, Phone } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface HeaderProps {
  user: User | null;
  minimal?: boolean;
}

export const Header = ({
  user,
  minimal = false
}: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { language, t } = useLanguage();

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

  return (
    <header className="glass-card sticky top-0 z-50 border-0 border-b border-white/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4 lg:py-6">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="pulse-ring w-12 h-12 -top-3 -left-3 lg:w-16 lg:h-16 lg:-top-4 lg:-left-4"></div>
              <div className="relative p-2 lg:p-3 rounded-2xl shadow-glow animate-glow bg-white">
                <Stethoscope className="h-5 w-5 lg:h-7 lg:w-7 text-dental-primary" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-secondary rounded-full animate-pulse shadow-float"></div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl lg:text-2xl font-bold gradient-text">
                Denti Bot Unified
              </h1>
              <p className="text-xs lg:text-sm text-dental-muted-foreground">
                {language === 'fr' ? "Plateforme de soins dentaires propulsée par l'IA" : language === 'nl' ? "Door AI aangedreven tandheelkundig platform" : 'AI-Powered Dental Care Platform'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          {!minimal && (
            <nav className="hidden lg:flex items-center space-x-8">
              {navigation.map(item => (
                <a key={item.name} href={item.href} className="flex items-center space-x-2 text-dental-muted-foreground hover:text-dental-primary transition-colors duration-300 font-medium">
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </a>
              ))}
            </nav>
          )}

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            {!minimal && (
              <div className="hidden sm:block">
                <LanguageSelector />
              </div>
            )}
            
            {!user ? (
              <>
                <div className="hidden sm:block">
                  <ProgressiveAuthForm compact />
                </div>
                <div className="block sm:hidden">
                  <AppButton size="mobile" variant="outline" className="bg-white/10 backdrop-blur-sm border-white/20 text-dental-primary">
                    {t.signIn}
                  </AppButton>
                </div>
              </>
            ) : (
              <AppButton variant="outline" size="desktop" className="bg-white/10 backdrop-blur-sm border-white/20 text-dental-primary hover:bg-white/20" asChild>
                <a href="/clinical">
                  <Settings className="w-4 h-4 mr-2" />
                  {language === 'fr' ? 'Tableau de bord' : 'Dashboard'}
                </a>
              </AppButton>
            )}

            {/* Mobile Menu Button */}
            {!minimal && (
              <AppButton variant="ghost" size="mobile" className="lg:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </AppButton>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && !minimal && (
          <div className="lg:hidden py-4 border-t border-white/10">
            <nav className="space-y-4">
              {navigation.map(item => (
                <a key={item.name} href={item.href} className="flex items-center space-x-3 text-dental-muted-foreground hover:text-dental-primary transition-colors duration-300 font-medium py-2" onClick={() => setIsMobileMenuOpen(false)}>
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </a>
              ))}
              
              {/* Mobile Language Selector */}
              <div className="pt-4 border-t border-white/10">
                <LanguageSelector />
              </div>
              
              {!user && (
                <div className="pt-4 border-t border-white/10">
                  <ProgressiveAuthForm />
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};