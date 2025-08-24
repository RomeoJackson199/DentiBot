import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ModernNotificationCenter } from "@/components/notifications/ModernNotificationCenter";
import { useLanguage } from "@/hooks/useLanguage";
import { useIsMobile } from "@/hooks/use-mobile";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity,
  Calendar,
  Users,
  CreditCard,
  BarChart3,
  Boxes,
  Upload,
  Settings,
  Paintbrush,
  Languages,
  Shield,
  Search,
  Building2,
  Bell,
  ChevronDown,
  Home,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const LAST_GROUP_KEY = "sidebar:last-group";

type NavItem = {
  label: string;
  icon: React.ReactNode;
  to: string;
  badge?: string | number;
  isActive?: (path: string) => boolean;
};

type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

function TopBar() {
  const [openSearch, setOpenSearch] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { setTheme, theme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id ?? null));
  }, []);

  return (
    <div className="sticky top-0 z-40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex items-center gap-2 px-3 md:px-4 py-2">
        <SidebarTrigger className="md:hidden" />
        <div className="flex items-center gap-2 text-muted-foreground">
          <Home className="h-4 w-4" />
          <Separator orientation="vertical" className="h-4" />
          <Button variant="outline" size="sm" onClick={() => setOpenSearch(true)} className="gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">{t.topSearch}</span>
            <span className="text-xs text-muted-foreground hidden md:inline">/</span>
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">{t.topClinic}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Clinic</DropdownMenuLabel>
              <DropdownMenuItem>Default Clinic</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>Add clinic (soon)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {userId && <ModernNotificationCenter userId={userId} />}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Bell className="h-4 w-4 opacity-0" />
                <span className="hidden sm:inline">{t.topProfile}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Preferences</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{t.theme}: {theme}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Language</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setLanguage('en')}>🇬🇧 English</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('fr')}>🇫🇷 Français</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('nl')}>🇳🇱 Nederlands</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => supabase.auth.signOut()}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <GlobalSearch open={openSearch} onOpenChange={setOpenSearch} />
      </div>
    </div>
  );
}

function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/") {
        onOpenChange(true);
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput value={query} onValueChange={setQuery} placeholder="Search patients, payments, inventory..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => { onOpenChange(false); navigate("/dashboard"); }}>Dashboard</CommandItem>
          <CommandItem onSelect={() => { onOpenChange(false); navigate("/analytics"); }}>Analytics</CommandItem>
          <CommandItem onSelect={() => { onOpenChange(false); navigate("/schedule"); }}>Schedule</CommandItem>
          <CommandItem onSelect={() => { onOpenChange(false); navigate("/dashboard#inventory"); }}>Inventory</CommandItem>
          <CommandItem onSelect={() => { onOpenChange(false); navigate("/dashboard#payments"); }}>Payments</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { t } = useLanguage();

  useScrollRestoration();

  const [openGroupId, setOpenGroupId] = useState<string | null>(() => localStorage.getItem(LAST_GROUP_KEY));

  useEffect(() => {
    if (openGroupId) localStorage.setItem(LAST_GROUP_KEY, openGroupId);
  }, [openGroupId]);

  const groups: NavGroup[] = useMemo(() => [
    {
      id: "clinical",
      label: t.navClinical,
      items: [
        { label: t.navDashboard, icon: <Activity className="h-4 w-4" />, to: "/dashboard", isActive: p => p.startsWith("/dashboard") && !p.includes("#appointments") },
        { label: t.navAppointments, icon: <Calendar className="h-4 w-4" />, to: "/schedule" },
        { label: t.navPatients, icon: <Users className="h-4 w-4" />, to: "/dashboard#patients" },
      ],
    },
    {
      id: "business",
      label: t.navBusiness,
      items: [
        { label: t.navPayments, icon: <CreditCard className="h-4 w-4" />, to: "/dashboard#payments" },
        { label: t.navAnalytics, icon: <BarChart3 className="h-4 w-4" />, to: "/analytics" },
      ],
    },
    {
      id: "operations",
      label: t.navOperations,
      items: [
        { label: t.navInventory, icon: <Boxes className="h-4 w-4" />, to: "/dashboard#inventory" },
        { label: t.navImport, icon: <Upload className="h-4 w-4" />, to: "/dashboard#import" },
      ],
    },
    {
      id: "admin",
      label: t.navAdmin,
      items: [
        { label: t.navSchedule, icon: <Calendar className="h-4 w-4" />, to: "/schedule" },
        { label: t.navSettings, icon: <Settings className="h-4 w-4" />, to: "/settings?section=branding" },
      ],
    },
  ], []);

  const handleNav = (to: string) => {
    navigate(to);
  };

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <Sidebar collapsible={isMobile ? "offcanvas" : "icon"}>
        <SidebarHeader className="px-2 py-3">
          <div className="flex items-center gap-2 px-1">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-pill)] bg-[hsl(var(--brand-100))] text-[hsl(var(--brand-600))] font-semibold">D</span>
            <span className="font-semibold">Dentibot</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          {groups.map((group) => (
            <SidebarGroup key={group.id}>
              <SidebarGroupLabel className="flex items-center justify-between pr-8">
                <span>{group.label}</span>
                <SidebarGroupAction aria-label="Collapse group" onClick={() => setOpenGroupId(prev => prev === group.id ? null : group.id)}>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", openGroupId === group.id ? "rotate-0" : "-rotate-90")} />
                </SidebarGroupAction>
              </SidebarGroupLabel>
              {openGroupId === group.id && (
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton isActive={item.isActive ? item.isActive(location.pathname + location.hash) : (location.pathname + location.hash).startsWith(item.to)} onClick={() => handleNav(item.to)}>
                          {item.icon}
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                        {typeof item.badge !== 'undefined' && (
                          <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                        )}
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter>
          <Button variant="outline" size="sm" className="w-full justify-start"><Languages className="h-4 w-4 mr-2" />EN/FR/NL</Button>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <TopBar />
        <div className="p-3 md:p-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default AppShell;

