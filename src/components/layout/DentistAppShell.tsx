import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Calendar,
  UserCog,
  Search,
  Bell,
  Settings as SettingsIcon,
  LogOut,
  User,
  MessageSquare,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMobileOptimizations } from "@/components/mobile/MobileOptimizations";
import { useClinicBranding } from "@/hooks/useClinicBranding";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { BusinessSelector } from "@/components/BusinessSelector";
import { useBusinessTemplate } from "@/hooks/useBusinessTemplate";

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
  dentistId,
}) => {
  const { toast } = useToast();
  const { isMobile } = useMobileOptimizations();
  const { branding } = useClinicBranding();
  const { t } = useBusinessTemplate();
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationCount] = useState(0);
  const [userName, setUserName] = useState<string>("");
  const [userInitials, setUserInitials] = useState<string>("?");

  const NAV_ITEMS = useMemo(() => [
    { id: 'dashboard' as DentistSection, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients' as DentistSection, label: t('customerPlural'), icon: Users },
    { id: 'appointments' as DentistSection, label: t('appointmentPlural'), icon: Calendar },
    { id: 'employees' as DentistSection, label: 'Staff', icon: UserCog },
    { id: 'messages' as DentistSection, label: 'Messages', icon: MessageSquare },
  ], [t]);

  const isActive = (section: DentistSection) => activeSection === section;

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

  // Load current user display name
  React.useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('user_id', user.id)
        .maybeSingle();
      const full = `${data?.first_name ?? ''} ${data?.last_name ?? ''}`.trim();
      setUserName(full || data?.email || '');
      const fi = (data?.first_name?.[0] || '').toUpperCase();
      const li = (data?.last_name?.[0] || '').toUpperCase();
      setUserInitials((fi + li || user.email?.[0] || '?').toString().toUpperCase());
    })();
  }, []);


  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        {/* Mobile Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-2">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt="Clinic Logo" className="h-8 w-8 rounded-lg object-cover" />
              ) : (
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">D</span>
                </div>
              )}
              <span className="font-semibold text-lg">{branding.clinicName || "Dentist Portal"}</span>
            </div>
            <BusinessSelector />
          </div>
        </div>

        {/* Main Content */}
        <div className="pt-16 min-h-screen">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
          <div className="grid grid-cols-5 gap-2 p-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.id);

              return (
                <button
                  key={item.id}
                  onClick={() => onChangeSection(item.id)}
                  className={cn(
                    "flex w-full flex-col items-center justify-center px-3 py-2.5 rounded-lg transition-all",
                    active ? "text-primary bg-primary/10 font-semibold" : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs mt-1">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mr-8">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt="Clinic Logo" className="h-8 w-8 rounded-lg object-cover" />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">D</span>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.id);

              return (
                <button
                  key={item.id}
                  onClick={() => onChangeSection(item.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    active
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Section: Search, Notifications, User */}
          <div className="ml-auto flex items-center gap-3">
            {/* Business Selector */}
            <BusinessSelector />
            
            {/* Role Switcher */}
            <RoleSwitcher />
            
            {/* Search */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-12 h-9 bg-muted/50"
              />
              <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                ⌘K
              </kbd>
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative h-9 w-9" onClick={() => toast({ title: 'Notifications', description: notificationCount ? `You have ${notificationCount} notifications` : 'No new notifications' })}>
              <Bell className="h-4 w-4" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
              )}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 px-2 gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-xs font-medium truncate max-w-[120px]">{userName || 'Account'}</span>
                    <span className="text-[10px] text-muted-foreground">Dentist</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onChangeSection('users')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onChangeSection('settings')}>
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default DentistAppShell;