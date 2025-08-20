import React from "react";
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
  LogOut,
  Info
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationButton } from "@/components/NotificationButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMobileOptimizations } from "@/components/mobile/MobileOptimizations";

export type PatientSection = 'home' | 'assistant' | 'care' | 'appointments' | 'payments' | 'settings';

interface PatientAppShellProps {
  activeSection: PatientSection;
  onChangeSection: (section: PatientSection) => void;
  children: React.ReactNode;
  badges?: Partial<Record<PatientSection, boolean>>;
  userId: string;
}

// Simplified navigation items - only bottom bar, no duplication
const NAV_ITEMS: Array<{ id: PatientSection; label: string; shortLabel?: string; icon: React.ComponentType<any>; color: string }> = [
  { id: 'home', label: 'Home', icon: HomeIcon, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
  { id: 'assistant', label: 'Assistant', icon: Bot, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
  { id: 'care', label: 'Treatment Records', shortLabel: 'Records', icon: FolderOpen, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
  { id: 'appointments', label: 'Appointments', shortLabel: 'Appts', icon: Calendar, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
  { id: 'payments', label: 'Payments', icon: CreditCard, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
];

export const PatientAppShell: React.FC<PatientAppShellProps> = ({
  activeSection,
  onChangeSection,
  children,
  badges = {},
  userId,
}) => {
  const { toast } = useToast();
  // Guard navigate for tests without Router
  let navigate = useNavigate as unknown as (() => (path: string) => void);
  try {
    // Attempt to call hook; if it throws, fall back
    navigate = useNavigate();
  } catch {
    navigate = ((path: string) => { window.location.href = path; }) as any;
  }
  const { isMobile } = useMobileOptimizations();

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

  const handleSettingsClick = () => {
    // If we're already on settings, do nothing to prevent confusion
    if (activeSection === 'settings') {
      return;
    }
    // Change to settings section
    onChangeSection('settings');
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Mobile Header */}
        <div className="fixed top-0 left-0 right-0 z-header bg-background/95 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">P</span>
              </div>
              <span className="font-semibold text-lg">Patient Portal</span>
            </div>

            <div className="flex items-center space-x-2">
              <NotificationButton userId={userId} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                      "hover:bg-primary/10 transition-colors",
                      activeSection === 'settings' && "bg-primary/10 text-primary"
                    )}
                  >
                    <SettingsIcon className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Menu</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSettingsClick}>
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/about')}>
                    <Info className="mr-2 h-4 w-4" />
                    About Dentinot
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

        {/* Main Content Area */}
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

        {/* Bottom Navigation Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-header bg-background/95 backdrop-blur-sm border-t safe-bottom">
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
      </div>
    );
  }

  // Desktop Layout with Sidebar
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex">
      {/* Desktop Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-64 bg-card/80 backdrop-blur-lg border-r border-border/50 z-header">
        {/* Sidebar Header */}
        <div className="flex items-center space-x-3 p-6 border-b border-border/50">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">P</span>
          </div>
          <div>
            <h1 className="font-semibold text-lg">Patient Portal</h1>
            <p className="text-sm text-muted-foreground">Healthcare Dashboard</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
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
                        "w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all relative group",
                        active 
                          ? "bg-primary text-primary-foreground shadow-md" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <div className="relative">
                        <Icon className="h-5 w-5" />
                        {hasBadge && (
                          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 rounded-full animate-pulse" />
                        )}
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50">
          <div className="flex items-center justify-between">
            <NotificationButton userId={userId} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn(
                    "hover:bg-primary/10 transition-colors",
                    activeSection === 'settings' && "bg-primary/10 text-primary"
                  )}
                >
                  <SettingsIcon className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 mb-2">
                <DropdownMenuItem onClick={handleSettingsClick}>
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/about')}>
                  <Info className="mr-2 h-4 w-4" />
                  About Dentinot
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

      {/* Main Content Area */}
      <div className="flex-1 ml-64">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen p-6"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};