import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home as HomeIcon,
  FolderOpen,
  Calendar,
  CreditCard,
  Settings as SettingsIcon,
  Bot,
  Menu,
  X,
  LogOut,
  User,
  Info,
  MessageSquare
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type PatientSection = 'home' | 'messages' | 'assistant' | 'care' | 'appointments' | 'payments' | 'settings';

interface PatientAppShellProps {
  activeSection: PatientSection;
  onChangeSection: (section: PatientSection) => void;
  children: React.ReactNode;
  badges?: Partial<Record<PatientSection, boolean>>;
}

// Simplified navigation items - only bottom bar, no duplication
const NAV_ITEMS: Array<{ id: PatientSection; label: string; shortLabel?: string; icon: React.ComponentType<any>; color: string }> = [
  { id: 'home', label: 'Home', icon: HomeIcon, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
  { id: 'messages', label: 'Messages', shortLabel: 'Msgs', icon: MessageSquare, color: 'text-sky-600 bg-sky-100 dark:bg-sky-900/30' },
  { id: 'assistant', label: 'Assistant', icon: Bot, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
  { id: 'care', label: 'Treatment Records', shortLabel: 'Records', icon: FolderOpen, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
  { id: 'appointments', label: 'Appointments', shortLabel: 'Appts', icon: Calendar, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
  { id: 'payments', label: 'Payments', icon: CreditCard, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
  { id: 'settings', label: 'Settings', icon: SettingsIcon, color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30' },
];

export const PatientAppShell: React.FC<PatientAppShellProps> = ({
  activeSection,
  onChangeSection,
  children,
  badges = {},
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const isActive = (id: PatientSection) => activeSection === id;

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Mobile Header - cleaner with menu dropdown */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-header bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">P</span>
            </div>
            <span className="font-semibold text-lg">Patient Portal</span>
          </div>
          
          {/* Simple dropdown menu for extra options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Menu</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onChangeSection('settings')}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/about')}>
                <Info className="mr-2 h-4 w-4" />
                About Dentibot
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Desktop Header - minimal top bar */}
      <div className="hidden md:block fixed top-0 left-0 right-0 z-header bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">P</span>
            </div>
            <span className="font-semibold text-xl">Patient Portal</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                  <User className="h-4 w-4 mr-2" />
                  Account
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onChangeSection('settings')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/about')}>
                  <Info className="mr-2 h-4 w-4" />
                  About Dentibot
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content Area with proper spacing */}
      <div className="mobile-header-offset mobile-bottom-nav-offset min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="min-h-[calc(100vh-8rem)]"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation Bar - Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-header bg-background/95 backdrop-blur-sm border-t safe-bottom">
        <nav className="flex items-center justify-around py-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.id);
            const hasBadge = badges[item.id];
            
            return (
              <button
                key={item.id}
                onClick={() => onChangeSection(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all relative touch-target",
                  active 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="relative">
                  <Icon className={cn("h-5 w-5", active && "scale-110")} />
                  {hasBadge && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </div>
                <span className="text-xs mt-1">{item.shortLabel || item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Navigation Bar - Desktop */}
      <div className="hidden md:block fixed bottom-0 left-0 right-0 z-header bg-background/95 backdrop-blur-sm border-t">
        <nav className="flex items-center justify-center space-x-8 py-4">
          <TooltipProvider>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.id);
              const hasBadge = badges[item.id];
              
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onChangeSection(item.id)}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-xl transition-all relative group touch-target",
                        active 
                          ? "text-primary bg-primary/10" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <div className="relative">
                        <Icon className={cn(
                          "h-6 w-6 transition-transform",
                          active && "scale-110",
                          "group-hover:scale-110"
                        )} />
                        {hasBadge && (
                          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 rounded-full animate-pulse" />
                        )}
                      </div>
                      <span className="text-xs mt-1.5 font-medium">{item.label}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </nav>
      </div>
    </div>
  );
};