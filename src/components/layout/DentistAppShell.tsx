import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Stethoscope,
  Calendar,
  Users,
  Clock,
  Wallet,
  BarChart3,
  FileBarChart,
  Boxes,
  Upload,
  Palette,
  Shield,
  LogOut,
  PanelLeft,
  Settings as SettingsIcon,
  ChevronDown,
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
import { useMobileOptimizations } from "@/components/mobile/MobileOptimizations";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useClinicBranding } from "@/hooks/useClinicBranding";

export type DentistSection = 'clinical' | 'patients' | 'appointments' | 'schedule' | 'payments' | 'analytics' | 'reports' | 'inventory' | 'imports' | 'branding' | 'security';

interface DentistAppShellProps {
  activeSection: DentistSection;
  onChangeSection: (section: DentistSection) => void;
  children: React.ReactNode;
  badges?: Partial<Record<DentistSection, number>>;
  dentistId: string;
}

const NAV_GROUPS = [
  {
    id: 'clinical',
    label: 'Clinical',
    items: [
      { id: 'clinical' as DentistSection, label: 'Dashboard', icon: Stethoscope, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
      { id: 'patients' as DentistSection, label: 'Patients', icon: Users, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
      { id: 'appointments' as DentistSection, label: 'Appointments', icon: Clock, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
      { id: 'schedule' as DentistSection, label: 'Schedule', icon: Calendar, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
    ],
  },
  {
    id: 'business',
    label: 'Business',
    items: [
      { id: 'payments' as DentistSection, label: 'Payments', icon: Wallet, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
      { id: 'analytics' as DentistSection, label: 'Analytics', icon: BarChart3, color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30' },
      { id: 'reports' as DentistSection, label: 'Reports', icon: FileBarChart, color: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30' },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      { id: 'inventory' as DentistSection, label: 'Inventory', icon: Boxes, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
      { id: 'imports' as DentistSection, label: 'Data Imports', icon: Upload, color: 'text-rose-600 bg-rose-100 dark:bg-rose-900/30' },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    items: [
      { id: 'branding' as DentistSection, label: 'Branding', icon: Palette, color: 'text-pink-600 bg-pink-100 dark:bg-pink-900/30' },
      { id: 'security' as DentistSection, label: 'Security', icon: Shield, color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
    ],
  },
];

export const DentistAppShell: React.FC<DentistAppShellProps> = ({
  activeSection,
  onChangeSection,
  children,
  badges = {},
  dentistId,
}) => {
  const { toast } = useToast();
  const { isMobile } = useMobileOptimizations();
  const { branding } = useClinicBranding(dentistId);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem('dsidebar:collapsed') === '1'; } catch { return false; }
  });
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    try { 
      const saved = localStorage.getItem('dsidebar:groups');
      return saved ? JSON.parse(saved) : { clinical: true }; 
    } catch { 
      return { clinical: true }; 
    }
  });

  useEffect(() => {
    try { localStorage.setItem('dsidebar:collapsed', collapsed ? '1' : '0'); } catch {}
  }, [collapsed]);

  useEffect(() => {
    try { localStorage.setItem('dsidebar:groups', JSON.stringify(openGroups)); } catch {}
  }, [openGroups]);

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

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 overflow-x-hidden">
        {/* Mobile Header */}
        <div className="fixed top-0 left-0 right-0 z-header bg-background/95 backdrop-blur-sm border-b">
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

            <div className="flex items-center gap-1">
              <LanguageSelector />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="touch-target">
                    <SettingsIcon className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Menu</DropdownMenuLabel>
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

        {/* Main Content */}
        <div className="mobile-header-offset min-h-screen pt-4">
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

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-header bg-background/95 backdrop-blur-sm border-t safe-bottom">
          <div className="grid grid-cols-4 gap-1 p-2">
            {NAV_GROUPS.slice(0, 4).map((group) => {
              const mainItem = group.items[0];
              const Icon = mainItem.icon;
              const active = isActive(mainItem.id);
              const badgeCount = badges[mainItem.id] || 0;

              return (
                <button
                  key={group.id}
                  onClick={() => onChangeSection(mainItem.id)}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all relative touch-target",
                    active ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="relative">
                    <Icon className={cn("h-5 w-5", active && "scale-110")} />
                    {badgeCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                  </div>
                  <span className="text-xs mt-1">{group.label}</span>
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex">
      {/* Desktop Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 bottom-0 bg-card/80 backdrop-blur-lg border-r border-border/50 z-sidebar transition-[width] duration-200 ease-linear overflow-hidden",
        collapsed ? "w-16" : "w-64"
      )}>
        {/* Sidebar Header */}
        <div className="flex items-center p-4 border-b border-border/50 gap-3">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt="Clinic Logo" className="h-9 w-9 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-bold text-sm">D</span>
            </div>
          )}
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="font-semibold text-base leading-tight truncate">{branding.clinicName || "Dentist Portal"}</h1>
              <p className="text-xs text-muted-foreground">Clinical Dashboard</p>
            </div>
          )}
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCollapsed(!collapsed)}
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation Groups */}
        <div className={cn("p-2 space-y-2 overflow-y-auto overflow-x-hidden h-[calc(100vh-140px)]", collapsed && "p-1")}>
          <TooltipProvider>
            {NAV_GROUPS.map((group) => (
              <div key={group.id} className="space-y-1">
                {!collapsed && (
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span>{group.label}</span>
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform",
                      openGroups[group.id] ? "rotate-0" : "-rotate-90"
                    )} />
                  </button>
                )}
                
                <div className={cn(
                  "space-y-1 overflow-hidden transition-all duration-200",
                  !collapsed && !openGroups[group.id] && "max-h-0 opacity-0",
                  (!collapsed && openGroups[group.id]) || collapsed ? "max-h-[400px] opacity-100" : ""
                )}>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.id);
                    const badgeCount = badges[item.id] || 0;

                    return (
                      <Tooltip key={item.id}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => onChangeSection(item.id)}
                            className={cn(
                              "w-full flex items-center px-3 py-3 rounded-xl transition-all relative group focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                              active
                                ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:scale-[1.01]",
                              collapsed ? "justify-center" : "gap-3"
                            )}
                            aria-current={active ? 'page' : undefined}
                            aria-label={item.label}
                          >
                            <div className="relative shrink-0">
                              <Icon className="h-5 w-5" />
                              {badgeCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 rounded-full animate-pulse" />
                              )}
                            </div>
                            {!collapsed && <span className="font-medium truncate">{item.label}</span>}
                            {!collapsed && badgeCount > 0 && (
                              <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {badgeCount}
                              </span>
                            )}
                          </button>
                        </TooltipTrigger>
                        {collapsed && (
                          <TooltipContent side="right">
                            <p>{item.label}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            ))}
          </TooltipProvider>
        </div>

        {/* Sidebar Footer */}
        <div className={cn("absolute bottom-0 left-0 right-0 border-t border-border/50", collapsed ? "p-2" : "p-4")}>
          <div className={cn("flex items-center gap-2", collapsed && "flex-col")}>
            {!collapsed && <LanguageSelector />}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size={collapsed ? "icon" : "sm"}
                  className={cn("w-full", collapsed ? "h-8" : "justify-start")}
                >
                  <SettingsIcon className="h-4 w-4" />
                  {!collapsed && <span className="ml-2">Menu</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 mb-2">
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
      <div className={cn("flex-1 transition-[margin-left] duration-200 ease-linear", collapsed ? "ml-16" : "ml-64")}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen h-screen overflow-y-auto p-6"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DentistAppShell;