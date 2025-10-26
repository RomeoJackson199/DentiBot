import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Home as HomeIcon, FolderOpen, Calendar, CreditCard, Settings as SettingsIcon, Bot, LogOut, Info, PanelLeft, MessageSquare } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ModernNotificationCenter } from "@/components/notifications/ModernNotificationCenter";
import { FloatingBookingButton } from "@/components/patient/FloatingBookingButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMobileOptimizations } from "@/components/mobile/MobileOptimizations";
import { useClinicBranding } from "@/hooks/useClinicBranding";
import { LanguageSelector } from "@/components/LanguageSelector";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { UserTour, useUserTour } from "@/components/UserTour";
import { Settings } from "@/components/Settings";
import { Dialog, DialogContent } from "@/components/ui/dialog";
export type PatientSection = 'home' | 'assistant' | 'care' | 'appointments' | 'payments' | 'messages' | 'settings';
interface PatientAppShellProps {
  activeSection: PatientSection;
  onChangeSection: (section: PatientSection) => void;
  children: React.ReactNode;
  badges?: Partial<Record<PatientSection, boolean>>;
  userId: string;
  onBookAppointment?: () => void;
}
const NAV_ITEMS: Array<{
  id: PatientSection;
  label: string;
  shortLabel?: string;
  icon: React.ComponentType<any>;
  color: string;
}> = [{
  id: 'home',
  label: 'Home',
  icon: HomeIcon,
  color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30'
}, {
  id: 'assistant',
  label: 'Assistant',
  icon: Bot,
  color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30'
}, {
  id: 'care',
  label: 'Treatment Records',
  shortLabel: 'Records',
  icon: FolderOpen,
  color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30'
}, {
  id: 'appointments',
  label: 'Appointments',
  shortLabel: 'Appts',
  icon: Calendar,
  color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30'
}, {
  id: 'payments',
  label: 'Payments',
  icon: CreditCard,
  color: 'text-green-600 bg-green-100 dark:bg-green-900/30'
}, {
  id: 'messages',
  label: 'Messages',
  icon: MessageSquare,
  color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30'
}];
export const PatientAppShell: React.FC<PatientAppShellProps> = ({
  activeSection,
  onChangeSection,
  children,
  badges = {},
  userId,
  onBookAppointment
}) => {
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const {
    isMobile
  } = useMobileOptimizations();
  const {
    branding
  } = useClinicBranding();
  const {
    showTour,
    closeTour
  } = useUserTour("patient");
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem('psidebar:collapsed') === '1';
    } catch {
      return false;
    }
  });
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    fetchUser();
  }, []);
  React.useEffect(() => {
    try {
      localStorage.setItem('psidebar:collapsed', collapsed ? '1' : '0');
    } catch {}
  }, [collapsed]);
  const isActive = (id: PatientSection) => activeSection === id;
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    }
  };
  const handleSettingsClick = () => {
    setSettingsOpen(true);
  };
  if (isMobile) {
    return <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 overflow-x-hidden">
        {/* Mobile Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b" role="banner">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-2">
              {branding.logoUrl ? <img src={branding.logoUrl} alt={branding.clinicName || "Clinic Logo"} className="h-8 w-8 rounded-lg object-cover" /> : <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">P</span>
                </div>}
              <span className="font-semibold text-lg">{branding.clinicName || "Patient Portal"}</span>
            </div>

            <div className="flex items-center space-x-2">
              <RoleSwitcher />
              <LanguageSelector />
              <ModernNotificationCenter userId={userId} />
              {onBookAppointment && <Button variant="gradient" size="sm" onClick={onBookAppointment} className="hidden sm:flex touch-target" aria-label="Book appointment">
                  <Calendar className="h-4 w-4 mr-2" />
                  Book
                </Button>}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className={cn("hover:bg-primary/10 transition-colors touch-target min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2", activeSection === 'settings' && "bg-primary/10 text-primary")} aria-label="Open menu">
                    <SettingsIcon className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Menu</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSettingsClick} aria-label="Settings">
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/about')} aria-label="About">
                    <Info className="mr-2 h-4 w-4" />
                    About Dentinot
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600" aria-label="Logout">
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
            <motion.div key={activeSection} initial={{
            opacity: 0,
            y: 10
          }} animate={{
            opacity: 1,
            y: 0
          }} exit={{
            opacity: 0,
            y: -10
          }} transition={{
            duration: 0.2
          }} className="min-h-[calc(100vh-8rem)]">
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Floating Book Button for Mobile */}
        {onBookAppointment && <FloatingBookingButton onBookAppointment={onBookAppointment} />}

        {/* Bottom Navigation Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t safe-bottom">
          <nav className="flex items-center justify-around py-2" role="navigation" aria-label="Primary">
            {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = isActive(item.id);
            const hasBadge = badges[item.id];
            return <button key={item.id} onClick={() => onChangeSection(item.id)} className={cn("flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all relative touch-target min-h-[44px] min-w-[44px]", active ? "text-primary" : "text-muted-foreground hover:text-foreground")} aria-current={active ? 'page' : undefined} aria-label={item.label}>
                  <div className="relative">
                    <Icon className={cn("h-5 w-5", active && "scale-110")} />
                    {hasBadge && <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />}
                  </div>
                  <span className="text-xs mt-1">{item.shortLabel || item.label}</span>
                </button>;
          })}
          </nav>
        </div>
      </div>;
  }

  // Desktop Layout with Sidebar
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex" role="main">
      {/* Desktop Sidebar */}
      <div className={cn("fixed left-0 top-0 bottom-0 bg-card/80 backdrop-blur-lg border-r border-border/50 z-40 transition-[width] duration-200 ease-linear overflow-hidden", collapsed ? "w-16" : "w-64")}>
        {/* Sidebar Header */}
        <div className={cn("flex items-center border-b border-border/50 gap-3", collapsed ? "p-2" : "p-4")}> 
          {branding.logoUrl ? <img src={branding.logoUrl} alt={branding.clinicName || "Clinic Logo"} className="h-9 w-9 rounded-lg object-cover shrink-0" /> : <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-bold text-sm">P</span>
            </div>}
          {!collapsed && <div className="min-w-0">
              <h1 className="font-semibold text-base leading-tight truncate">{branding.clinicName || "Patient Portal"}</h1>
              <p className="text-xs text-muted-foreground">Healthcare Dashboard</p>
            </div>}
          <div className="ml-auto">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCollapsed(v => !v)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand" : "Collapse"}>
              <PanelLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className={cn("p-2", collapsed ? "space-y-1" : "space-y-2 p-4")} role="navigation" aria-label="Primary">
          <TooltipProvider>
            {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = isActive(item.id);
            const hasBadge = badges[item.id];
            return <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                     <button onClick={() => onChangeSection(item.id)} className={cn("w-full flex items-center px-3 py-3 rounded-xl transition-all relative group touch-target min-h-[40px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2", active ? "bg-primary text-primary-foreground shadow-md scale-[1.02]" : "text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:scale-[1.01]", collapsed ? "justify-center" : "gap-3")} aria-current={active ? 'page' : undefined} aria-label={item.label}>
                      <div className="relative shrink-0">
                        <Icon className="h-5 w-5" />
                        {hasBadge && <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 rounded-full animate-pulse" />}
                      </div>
                      {!collapsed && <span className="font-medium truncate">{item.label}</span>}
                    </button>
                  </TooltipTrigger>
                  {collapsed && <TooltipContent side="right">
                      <p>{item.label}</p>
                    </TooltipContent>}
                </Tooltip>;
          })}
          </TooltipProvider>
        </nav>

        {/* Sidebar Footer */}
        <div className={cn("absolute bottom-0 left-0 right-0 border-t border-border/50", collapsed ? "p-2" : "p-4")}>
          <div className="flex flex-col gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size={collapsed ? 'icon' : 'default'}
                    onClick={handleSettingsClick}
                    className={cn(
                      "w-full",
                      collapsed ? "justify-center" : "justify-start gap-3"
                    )}
                    aria-label="Settings"
                  >
                    <SettingsIcon className="h-5 w-5" />
                    {!collapsed && <span>Settings</span>}
                  </Button>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">
                    <p>Settings</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size={collapsed ? 'icon' : 'default'}
                    onClick={handleSignOut}
                    className={cn(
                      "w-full text-destructive hover:text-destructive hover:bg-destructive/10",
                      collapsed ? "justify-center" : "justify-start gap-3"
                    )}
                    aria-label="Sign Out"
                  >
                    <LogOut className="h-5 w-5" />
                    {!collapsed && <span>Sign Out</span>}
                  </Button>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">
                    <p>Sign Out</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={cn("flex-1 transition-[margin-left] duration-200 ease-linear", collapsed ? "ml-16" : "ml-64")}> 
        {/* Global header toggle so it’s ALWAYS visible */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCollapsed(v => !v)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
                <PanelLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div key={activeSection} initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -20
        }} transition={{
          duration: 0.3
        }} className="min-h-screen h-screen overflow-y-auto p-6">
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* User Tour */}
      <UserTour isOpen={showTour} onClose={closeTour} userRole="patient" />

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {currentUser && <Settings user={currentUser} />}
        </DialogContent>
      </Dialog>
    </div>;
};
export default PatientAppShell;