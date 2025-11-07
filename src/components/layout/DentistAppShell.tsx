import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Users, Calendar, UserCog, Settings as SettingsIcon, LogOut, MessageSquare, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMobileOptimizations } from "@/components/mobile/MobileOptimizations";
import { useClinicBranding } from "@/hooks/useClinicBranding";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BusinessSelector } from "@/components/BusinessSelector";
import { useBusinessTemplate } from "@/hooks/useBusinessTemplate";
import { useTemplateNavigation } from "@/hooks/useTemplateNavigation";
import { useNavigate } from "react-router-dom";
export type DentistSection = 'dashboard' | 'patients' | 'appointments' | 'employees' | 'messages' | 'clinical' | 'schedule' | 'payments' | 'analytics' | 'reports' | 'inventory' | 'imports' | 'branding' | 'security' | 'users' | 'team' | 'settings' | 'services';
interface DentistAppShellProps {
  activeSection: DentistSection;
  onChangeSection: (section: DentistSection) => void;
  children: React.ReactNode;
  badges?: Partial<Record<DentistSection, number>>;
  dentistId: string;
}
export const DentistAppShell: React.FC<DentistAppShellProps> = ({
  activeSection,
  onChangeSection,
  children,
  badges = {},
  dentistId
}) => {
  const {
    toast
  } = useToast();
  const {
    isMobile
  } = useMobileOptimizations();
  const {
    branding
  } = useClinicBranding();
  const {
    t
  } = useBusinessTemplate();
  const { filterNavItems, getRestaurantNavItems, isRestaurant } = useTemplateNavigation();
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>("");
  const [userInitials, setUserInitials] = useState<string>("?");
  const [userProfilePicture, setUserProfilePicture] = useState<string | null>(null);
  const allNavItems = useMemo(() => [{
    id: 'dashboard' as DentistSection,
    label: 'Dashboard',
    icon: LayoutDashboard
  }, {
    id: 'patients' as DentistSection,
    label: t('customerPlural'),
    icon: Users
  }, {
    id: 'appointments' as DentistSection,
    label: t('appointmentPlural'),
    icon: Calendar
  }, {
    id: 'employees' as DentistSection,
    label: 'Staff',
    icon: UserCog
  }, {
    id: 'messages' as DentistSection,
    label: 'Messages',
    icon: MessageSquare
  }], [t]);

  // Filter navigation items based on template configuration
  const NAV_ITEMS = useMemo(() => {
    const baseItems = filterNavItems(allNavItems);
    const restaurantItems = getRestaurantNavItems;
    
    // If restaurant template, prepend restaurant items
    if (isRestaurant && restaurantItems.length > 0) {
      return [...restaurantItems, ...baseItems];
    }
    
    return baseItems;
  }, [filterNavItems, allNavItems, getRestaurantNavItems, isRestaurant]);
  const isActive = (section: DentistSection) => activeSection === section;
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

  // Load current user display name
  React.useEffect(() => {
    (async () => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const {
        data
      } = await supabase.from('profiles').select('first_name, last_name, email, profile_picture_url').eq('user_id', user.id).maybeSingle();
      const full = `${data?.first_name ?? ''} ${data?.last_name ?? ''}`.trim();
      setUserName(full || data?.email || '');
      const fi = (data?.first_name?.[0] || '').toUpperCase();
      const li = (data?.last_name?.[0] || '').toUpperCase();
      setUserInitials((fi + li || user.email?.[0] || '?').toString().toUpperCase());
      setUserProfilePicture(data?.profile_picture_url || null);
    })();
  }, []);
  if (isMobile) {
    return <div className="min-h-screen bg-background">
        {/* Mobile Header - Simplified */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
          <div className="flex items-center justify-between px-3 py-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {branding.logoUrl ? <img src={branding.logoUrl} alt="Clinic Logo" className="h-8 w-8 rounded-lg object-cover flex-shrink-0" /> : <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground font-bold text-sm">D</span>
                </div>}
              <span className="font-semibold text-base truncate">{branding.clinicName || "Dentist Portal"}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0">
                  <SettingsIcon className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="flex flex-col">
                  <span className="text-sm font-medium">{userName || 'Account'}</span>
                  <span className="text-xs text-muted-foreground">Dentist</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onChangeSection('settings')} className="gap-2">
                  <SettingsIcon className="h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-destructive">
                  <LogOut className="h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Main Content */}
        <div className="pt-16 min-h-screen">
          <AnimatePresence mode="wait">
            <motion.div key={activeSection} initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} exit={{
            opacity: 0
          }} transition={{
            duration: 0.2
          }}>
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
          <div className="grid grid-cols-5 gap-2 p-2">
            {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = isActive(item.id);
             const handleClick = () => {
               if (item.path) {
                 navigate(item.path);
               } else {
                 onChangeSection(item.id);
               }
             };
             return <button key={item.id} onClick={handleClick} className={cn("flex w-full flex-col items-center justify-center px-3 py-2.5 rounded-lg transition-all", active ? "text-primary bg-primary/10 font-semibold" : "text-muted-foreground")}>
                  <Icon className="h-5 w-5" />
                  <span className="text-xs mt-1">{item.label}</span>
                </button>;
          })}
          </div>
        </div>
      </div>;
  }

  // Desktop Layout
  return <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mr-8">
            {branding.logoUrl ? <img src={branding.logoUrl} alt="Clinic Logo" className="h-8 w-8 rounded-lg object-cover" /> : <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">D</span>
              </div>}
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-2">
            {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = isActive(item.id);
            const handleClick = () => {
              if (item.path) {
                navigate(item.path);
              } else {
                onChangeSection(item.id);
              }
            };
            return <button key={item.id} onClick={handleClick} data-tour={`nav-${item.id}`} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all", active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>;
          })}
          </nav>

          {/* Right Section: Search, Notifications, User */}
          <div className="ml-auto flex items-center gap-3">
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 px-2 gap-2" data-tour="user-menu">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={userProfilePicture || undefined} />
                    <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-xs font-medium truncate max-w-[120px]">{userName || 'Account'}</span>
                    <span className="text-[10px] text-muted-foreground">Dentist</span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onChangeSection('settings')} className="gap-2">
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
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
        }} className="h-full">
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>;
};
export default DentistAppShell;