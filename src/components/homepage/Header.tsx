import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthForm } from "@/components/AuthForm";
import { User } from "@supabase/supabase-js";
import { Stethoscope, Menu, X, Calendar, Activity, BarChart3, Settings, Phone } from "lucide-react";
interface HeaderProps {
  user: User | null;
}
export const Header = ({
  user
}: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigation = [{
    name: 'Emergency Triage',
    href: '/emergency-triage',
    icon: Activity
  }, {
    name: 'Schedule',
    href: '/schedule',
    icon: Calendar
  }, {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3
  }, {
    name: 'Support',
    href: '/support',
    icon: Phone
  }];
  return <header className="glass-card sticky top-0 z-50 border-0 border-b border-white/10">
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
                AI-Powered Dental Care Platform
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigation.map(item => <a key={item.name} href={item.href} className="flex items-center space-x-2 text-dental-muted-foreground hover:text-dental-primary transition-colors duration-300 font-medium">
                
                
              </a>)}
          </nav>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {!user ? <>
                <div className="hidden sm:block">
                  <AuthForm compact />
                </div>
                <div className="block sm:hidden">
                  <Button size="sm" variant="outline" className="bg-white/10 backdrop-blur-sm border-white/20 text-dental-primary">
                    Sign In
                  </Button>
                </div>
              </> : <Button variant="outline" className="bg-white/10 backdrop-blur-sm border-white/20 text-dental-primary hover:bg-white/20" asChild>
                <a href="/dashboard">
                  <Settings className="w-4 h-4 mr-2" />
                  Dashboard
                </a>
              </Button>}

            {/* Mobile Menu Button */}
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && <div className="lg:hidden py-4 border-t border-white/10">
            <nav className="space-y-4">
              {navigation.map(item => <a key={item.name} href={item.href} className="flex items-center space-x-3 text-dental-muted-foreground hover:text-dental-primary transition-colors duration-300 font-medium py-2" onClick={() => setIsMobileMenuOpen(false)}>
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </a>)}
              {!user && <div className="pt-4 border-t border-white/10">
                  <AuthForm />
                </div>}
            </nav>
          </div>}
      </div>
    </header>;
};