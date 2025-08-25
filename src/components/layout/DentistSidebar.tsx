import React, { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
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
  ChevronLeft,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Navigation configuration
const navigationItems = [
  {
    group: "Clinical",
    items: [
      { title: "Dashboard", url: "/dentist/clinical/dashboard", icon: Stethoscope },
      { title: "Patients", url: "/dentist/clinical/patients", icon: Users },
      { title: "Appointments", url: "/dentist/clinical/appointments", icon: Clock },
      { title: "Schedule", url: "/dentist/clinical/schedule", icon: Calendar },
    ],
  },
  {
    group: "Business",
    items: [
      { title: "Payments", url: "/dentist/business/payments", icon: Wallet, badge: "payments" },
      { title: "Analytics", url: "/dentist/business/analytics", icon: BarChart3 },
      { title: "Reports", url: "/dentist/business/reports", icon: FileBarChart },
    ],
  },
  {
    group: "Operations",
    items: [
      { title: "Inventory", url: "/dentist/ops/inventory", icon: Boxes, badge: "inventory" },
      { title: "Data Imports", url: "/dentist/ops/imports", icon: Upload },
    ],
  },
  {
    group: "Admin",
    items: [
      { title: "Branding", url: "/dentist/admin/branding", icon: Palette },
      { title: "Security", url: "/dentist/admin/security", icon: Shield },
    ],
  },
];

interface DentistSidebarProps {
  dentistId: string;
  children: React.ReactNode;
  onTabChange?: (tab: string) => void;
}

export function DentistSidebar({ dentistId, children, onTabChange }: DentistSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [badgeCounts, setBadgeCounts] = useState({ payments: 0, inventory: 0 });

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
      const interval = setInterval(fetchBadgeCounts, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [dentistId]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const getBadgeCount = (badgeType?: string) => {
    if (badgeType === 'payments') return badgeCounts.payments;
    if (badgeType === 'inventory') return badgeCounts.inventory;
    return 0;
  };

  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-accent text-accent-foreground border-l-4 border-primary" : "hover:bg-accent/50";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="w-72 border-r">
          {/* Header */}
          <SidebarHeader className="border-b p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                D
              </div>
              <div>
                <h2 className="font-semibold text-sm">Dentist Portal</h2>
                <p className="text-xs text-muted-foreground">Dashboard</p>
              </div>
            </div>
          </SidebarHeader>

          {/* Navigation Content */}
          <SidebarContent>
            {navigationItems.map((section) => (
              <SidebarGroup key={section.group}>
                <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {section.group}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => {
                      const badgeCount = getBadgeCount(item.badge);
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild>
                            <NavLink 
                              to={item.url} 
                              className={getNavClass}
                              onClick={() => onTabChange?.(item.title.toLowerCase())}
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                              {badgeCount > 0 && (
                                <SidebarMenuBadge className="bg-destructive text-destructive-foreground">
                                  {badgeCount}
                                </SidebarMenuBadge>
                              )}
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          {/* Footer */}
          <SidebarFooter className="border-t p-4">
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-start gap-3"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <main className="flex-1">
          <div className="sticky top-0 z-40 bg-background border-b p-2 md:hidden">
            <SidebarTrigger />
          </div>
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}