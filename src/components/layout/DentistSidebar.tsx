import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
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
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Navigation groups configuration
const navigationGroups = [
  {
    id: "clinical",
    label: "Clinical",
    items: [
      { id: "dashboard", label: "Dashboard", icon: Stethoscope, path: "/clinical/dashboard" },
      { id: "patients", label: "Patients", icon: Users, path: "/clinical/patients" },
      { id: "appointments", label: "Appointments", icon: Clock, path: "/clinical/appointments" },
      { id: "schedule", label: "Schedule", icon: Calendar, path: "/clinical/schedule" },
    ],
  },
  {
    id: "business",
    label: "Business",
    items: [
      { id: "payments", label: "Payments", icon: Wallet, path: "/business/payments", badge: "payments" },
      { id: "analytics", label: "Analytics", icon: BarChart3, path: "/business/analytics" },
      { id: "reports", label: "Reports", icon: FileBarChart, path: "/business/reports" },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      { id: "inventory", label: "Inventory", icon: Boxes, path: "/ops/inventory", badge: "inventory" },
      { id: "imports", label: "Data Imports", icon: Upload, path: "/ops/imports" },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    items: [
      { id: "branding", label: "Branding & Localization", icon: Palette, path: "/admin/branding" },
      { id: "security", label: "Security", icon: Shield, path: "/admin/security" },
    ],
  },
];

interface DentistSidebarProps {
  dentistId: string;
  children: React.ReactNode;
  onTabChange?: (tab: string) => void;
}

interface BadgeCounts {
  payments: number;
  inventory: number;
}

export function DentistSidebar({ dentistId, children, onTabChange }: DentistSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Sidebar state management
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('dentist-sidebar-expanded');
    if (stored !== null) return JSON.parse(stored);
    // Default state based on screen size
    return window.innerWidth >= 1024;
  });

  // Group collapse state
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return { clinical: true };
    const stored = localStorage.getItem('dentist-sidebar-groups');
    return stored ? JSON.parse(stored) : { clinical: true };
  });

  // Badge counts
  const [badgeCounts, setBadgeCounts] = useState<BadgeCounts>({
    payments: 0,
    inventory: 0,
  });

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('dentist-sidebar-expanded', JSON.stringify(isExpanded));
  }, [isExpanded]);

  useEffect(() => {
    localStorage.setItem('dentist-sidebar-groups', JSON.stringify(openGroups));
  }, [openGroups]);

  // Fetch badge counts
  useEffect(() => {
    const fetchBadgeCounts = async () => {
      try {
        // Fetch overdue payments count
        const { data: overduePayments } = await supabase
          .from('payment_requests')
          .select('id')
          .eq('dentist_id', dentistId)
          .eq('status', 'overdue');

        // Fetch low inventory count
        const { data: inventoryItems } = await supabase
          .from('inventory_items')
          .select('quantity, min_threshold')
          .eq('dentist_id', dentistId);

        const lowStockCount = (inventoryItems || []).filter(
          (item: any) => item.quantity <= item.min_threshold
        ).length;

        setBadgeCounts({
          payments: (overduePayments || []).length,
          inventory: lowStockCount,
        });
      } catch (error) {
        console.error('Error fetching badge counts:', error);
      }
    };

    if (dentistId) {
      fetchBadgeCounts();
      // Refresh counts every 5 minutes
      const interval = setInterval(fetchBadgeCounts, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [dentistId]);

  // Auto-expand groups based on current path
  useEffect(() => {
    const currentPath = location.pathname;
    for (const group of navigationGroups) {
      if (group.items.some(item => currentPath.startsWith(item.path))) {
        setOpenGroups(prev => ({ ...prev, [group.id]: true }));
        break;
      }
    }
  }, [location.pathname]);

  // Handle navigation
  const handleNavigation = (path: string, itemId: string) => {
    navigate(path);
    onTabChange?.(itemId);
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  // Toggle group
  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // Check if item is active
  const isActiveItem = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Get badge count for item
  const getBadgeCount = (badgeType?: string) => {
    if (badgeType === 'payments') return badgeCounts.payments;
    if (badgeType === 'inventory') return badgeCounts.inventory;
    return 0;
  };

  // Responsive behavior
  const sidebarWidth = isExpanded ? 280 : 72;
  const shouldShowAsDrawer = isMobile;

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <SidebarProvider defaultOpen={!shouldShowAsDrawer && isExpanded}>
      <div className="flex min-h-screen w-full">
        {/* Sidebar */}
        <Sidebar
          variant={shouldShowAsDrawer ? "floating" : "sidebar"}
          collapsible={shouldShowAsDrawer ? "offcanvas" : "icon"}
          className={cn(
            "transition-all duration-200 ease-in-out",
            !shouldShowAsDrawer && (isExpanded ? "w-[280px]" : "w-[72px]")
          )}
        >
          {/* Header */}
          <SidebarHeader className="border-b border-border p-4">
            <div className="flex items-center justify-between">
              <div className={cn("flex items-center gap-3", !isExpanded && "justify-center")}>
                <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                  D
                </div>
                {isExpanded && (
                  <div>
                    <h2 className="font-semibold text-sm">Dentist Portal</h2>
                    <p className="text-xs text-muted-foreground">Dashboard</p>
                  </div>
                )}
              </div>
              {!shouldShowAsDrawer && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="h-6 w-6"
                  aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
                >
                  <Menu className="h-4 w-4" />
                </Button>
              )}
            </div>
          </SidebarHeader>

          {/* Content */}
          <SidebarContent className="px-2">
            <nav aria-label="Primary navigation" className="space-y-1">
              {navigationGroups.map((group) => (
                <SidebarGroup key={group.id} className="py-2">
                  <Collapsible
                    open={openGroups[group.id]}
                    onOpenChange={() => toggleGroup(group.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <SidebarGroupLabel
                        className={cn(
                          "flex items-center justify-between w-full p-2 hover:bg-accent rounded-md cursor-pointer",
                          "text-xs font-medium text-muted-foreground uppercase tracking-wider",
                          !isExpanded && "justify-center px-2"
                        )}
                        role="button"
                        tabIndex={0}
                        aria-expanded={openGroups[group.id]}
                        onKeyDown={(e) => handleKeyDown(e, () => toggleGroup(group.id))}
                      >
                        {isExpanded ? (
                          <>
                            <span>{group.label}</span>
                            {openGroups[group.id] ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                          </>
                        ) : (
                          <div className="h-1 w-4 bg-muted-foreground/30 rounded" />
                        )}
                      </SidebarGroupLabel>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <SidebarGroupContent>
                        <SidebarMenu>
                          {group.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = isActiveItem(item.path);
                            const badgeCount = getBadgeCount(item.badge);

                            return (
                              <SidebarMenuItem key={item.id}>
                                <SidebarMenuButton
                                  onClick={() => handleNavigation(item.path, item.id)}
                                  className={cn(
                                    "w-full justify-start gap-3 h-9 px-3",
                                    isActive && "bg-accent text-accent-foreground border-l-4 border-primary",
                                    "hover:bg-accent/50 transition-colors duration-200"
                                  )}
                                  aria-current={isActive ? "page" : undefined}
                                  title={!isExpanded ? item.label : undefined}
                                >
                                  <Icon className="h-4 w-4 flex-shrink-0" />
                                  {isExpanded && (
                                    <>
                                      <span className="flex-1 text-left">{item.label}</span>
                                      {badgeCount > 0 && (
                                        <SidebarMenuBadge className="ml-auto bg-destructive text-destructive-foreground">
                                          {badgeCount}
                                        </SidebarMenuBadge>
                                      )}
                                    </>
                                  )}
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            );
                          })}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarGroup>
              ))}
            </nav>
          </SidebarContent>

          {/* Footer */}
          <SidebarFooter className="border-t border-border p-4">
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className={cn(
                "w-full justify-start gap-3 h-9",
                !isExpanded && "justify-center px-0"
              )}
              title={!isExpanded ? "Sign out" : undefined}
            >
              <LogOut className="h-4 w-4" />
              {isExpanded && <span>Sign Out</span>}
            </Button>
          </SidebarFooter>

          {/* Collapse toggle for bottom of sidebar */}
          {!shouldShowAsDrawer && (
            <div className="absolute bottom-4 right-4">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleSidebar}
                className="h-6 w-6 rounded-full shadow-md"
                aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
              >
                <ChevronRight
                  className={cn(
                    "h-3 w-3 transition-transform duration-200",
                    isExpanded && "rotate-180"
                  )}
                />
              </Button>
            </div>
          )}
        </Sidebar>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {shouldShowAsDrawer && (
            <div className="sticky top-0 z-40 bg-background border-b border-border p-2">
              <SidebarTrigger className="h-8 w-8" />
            </div>
          )}
          
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}