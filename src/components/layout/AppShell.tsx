import React, { useEffect, useMemo, useRef, useState } from "react";
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
  SidebarInput,
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
  Stethoscope,
  Calendar,
  Users,
  Clock,
  Wallet,
  BarChart3,
  FileBarChart,
  Boxes,
  Upload,
  CalendarCog,
  Globe,
  Shield,
  Languages,
  Search,
  Building2,
  Bell,
  ChevronDown,
  Home,
  PanelLeft,
  Tooth,
  Plus,
  LogOut,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { emitAnalyticsEvent } from "@/lib/analyticsEvents";
import { useCurrentDentist } from "@/hooks/useCurrentDentist";

const STORAGE = {
  lastItem: "dnav:last-item",
  openGroups: "dnav:open-groups",
};

function readSidebarCookie(): boolean {
  try {
    const match = document.cookie.match(/(?:^|; )sidebar:state=([^;]+)/);
    if (match) return match[1] === "true";
  } catch {}
  return true;
}

type NavItem = {
  label: string;
  icon: React.ReactNode;
  to: string;
  badge?: string | number;
  isActive?: (path: string) => boolean;
  id: string;
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
  const { state, toggleSidebar } = useSidebar();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id ?? null));
  }, []);

  return (
    <div className="sticky top-0 z-40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex items-center gap-2 px-3 md:px-4 py-2">
        <SidebarTrigger className="md:hidden h-8 w-8" aria-label="Collapse or expand sidebar" title="Collapse/Expand" />
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSidebar}
          className="hidden md:inline-flex gap-2"
          aria-label={state === 'expanded' ? 'Collapse sidebar' : 'Expand sidebar'}
          title={state === 'expanded' ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <PanelLeft className="h-4 w-4" />
          <span>{state === 'expanded' ? 'Collapse' : 'Expand'}</span>
        </Button>
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
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => supabase.auth.signOut()}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
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
  const { dentistId, userId } = useCurrentDentist();

  useScrollRestoration();

  // Default open: expanded on >=1024px, collapsed on 768–1023px, drawer on <768px handled by component
  const [defaultOpen, setDefaultOpen] = useState(true);
  useEffect(() => {
    const cookieOpen = readSidebarCookie();
    const w = window.innerWidth;
    const computed = w >= 1024 ? true : w >= 768 ? false : false;
    setDefaultOpen(typeof cookieOpen === 'boolean' ? cookieOpen : computed);
    try { emitAnalyticsEvent('nav_state_persisted', '', { collapsed: !cookieOpen }); } catch {}
  }, []);

  // Persisted open groups (multi-expand)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE.openGroups);
      return raw ? JSON.parse(raw) : { clinical: true };
    } catch {
      return { clinical: true };
    }
  });
  useEffect(() => {
    try { localStorage.setItem(STORAGE.openGroups, JSON.stringify(openGroups)); } catch {}
  }, [openGroups]);

  // Critical badges
  const [paymentsOverdue, setPaymentsOverdue] = useState<number>(0);
  const [inventoryLow, setInventoryLow] = useState<number>(0);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!dentistId) return;
        const { data: overdue } = await (supabase as any)
          .from('payment_requests')
          .select('id, status')
          .eq('dentist_id', dentistId)
          .eq('status', 'overdue');
        const overdueCount = (overdue || []).length;
        const { data: items } = await (supabase as any)
          .from('inventory_items')
          .select('quantity, min_threshold')
          .eq('dentist_id', dentistId);
        const lowCount = (items || []).filter((i: any) => (i.quantity ?? 0) < (i.min_threshold ?? 0)).length;
        if (!cancelled) {
          setPaymentsOverdue(overdueCount);
          setInventoryLow(lowCount);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [dentistId]);

  const groups: NavGroup[] = useMemo(() => [
    {
      id: "clinical",
      label: t.navClinical,
      items: [
        { id: 'clinical-dashboard', label: t.navDashboard, icon: <Stethoscope className="h-4 w-4" />, to: "/clinical" },
        { id: 'clinical-schedule', label: t.navSchedule, icon: <Calendar className="h-4 w-4" />, to: "/clinical/schedule" },
        { id: 'clinical-patients', label: t.navPatients, icon: <Users className="h-4 w-4" />, to: "/clinical/patients" },
        { id: 'clinical-appointments', label: t.navAppointments, icon: <Clock className="h-4 w-4" />, to: "/clinical/appointments" },
      ],
    },
    {
      id: "business",
      label: t.navBusiness,
      items: [
        { id: 'business-payments', label: t.navPayments, icon: <Wallet className="h-4 w-4" />, to: "/business/payments", badge: paymentsOverdue || undefined },
        { id: 'business-analytics', label: t.navAnalytics, icon: <BarChart3 className="h-4 w-4" />, to: "/business/analytics" },
        { id: 'business-reports', label: t.navReports, icon: <FileBarChart className="h-4 w-4" />, to: "/business/reports" },
      ],
    },
    {
      id: "operations",
      label: t.navOperations,
      items: [
        { id: 'ops-inventory', label: t.navInventory, icon: <Boxes className="h-4 w-4" />, to: "/ops/inventory", badge: inventoryLow || undefined },
        { id: 'ops-imports', label: t.navImport, icon: <Upload className="h-4 w-4" />, to: "/ops/imports" },
      ],
    },
    {
      id: "admin",
      label: t.navAdmin,
      items: [
        { id: 'admin-schedule', label: t.navSchedule + " Settings", icon: <CalendarCog className="h-4 w-4" />, to: "/admin/schedule" },
        { id: 'admin-branding', label: t.navBrandingLoc ?? 'Branding & Localization', icon: <Globe className="h-4 w-4" />, to: "/admin/branding" },
        { id: 'admin-security', label: t.navSecurity ?? 'Security', icon: <Shield className="h-4 w-4" />, to: "/admin/security" },
      ],
    },
  ], [t, paymentsOverdue, inventoryLow]);

  const handleNav = (to: string) => {
    try { localStorage.setItem(STORAGE.lastItem, to); } catch {}
    try { emitAnalyticsEvent('nav_click', '', { role: 'dentist', path: to, group: groups.find(g => g.items.some(i => i.to === to))?.id }); } catch {}
    navigate(to);
  };

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      try { localStorage.setItem(STORAGE.openGroups, JSON.stringify(next)); } catch {}
      try { emitAnalyticsEvent('nav_toggle_group', '', { group: groupId, expanded: !!next[groupId] }); } catch {}
      return next;
    });
  };

  // Deep-linking auto-expand
  useEffect(() => {
    const full = location.pathname + location.search + location.hash;
    for (const g of groups) {
      if (g.items.some(i => full.startsWith(i.to))) {
        setOpenGroups(prev => ({ ...prev, [g.id]: true }));
      }
    }
    // Special case: overdue payments query
    const params = new URLSearchParams(location.search);
    if (location.pathname.startsWith('/business/payments') && params.get('status') === 'overdue') {
      setOpenGroups(prev => ({ ...prev, business: true }));
    }
  }, [location.pathname, location.search]);

  // Restore last visited on initial mount when landing on dashboard root
  useEffect(() => {
    try {
      const last = localStorage.getItem(STORAGE.lastItem);
      const isRootDashboard = location.pathname === '/dashboard' || location.pathname === '/';
      if (last && isRootDashboard) {
        navigate(last, { replace: true });
      }
    } catch {}
    // run only on first mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard navigation within nav
  const navRef = useRef<HTMLDivElement | null>(null);
  const onKeyDownNav = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const container = navRef.current;
    if (!container) return;
    const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>("[data-sidebar='menu-button']"));
    const activeEl = document.activeElement as HTMLElement | null;
    const index = buttons.findIndex(b => b === activeEl);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = buttons[Math.min(buttons.length - 1, index + 1)] || buttons[0];
      next?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = buttons[Math.max(0, index - 1)] || buttons[buttons.length - 1];
      prev?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      // Collapse/expand groups
      const groupId = activeEl?.getAttribute('data-group-id') || '';
      if (groupId) {
        e.preventDefault();
        const wantExpand = e.key === 'ArrowRight';
        const isExpanded = !!openGroups[groupId];
        if ((wantExpand && !isExpanded) || (!wantExpand && isExpanded)) {
          toggleGroup(groupId);
        }
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (activeEl && activeEl.getAttribute('data-sidebar') === 'menu-button') {
        e.preventDefault();
        (activeEl as HTMLButtonElement).click();
      }
    }
  };

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <Sidebar variant="floating" collapsible={isMobile ? "offcanvas" : "icon"}>
        <SidebarHeader className="px-3 py-3">
          <div className="flex items-center gap-2 px-1">
            <div className="h-8 w-8 rounded-lg bg-[hsl(var(--brand-600))] text-white flex items-center justify-center font-semibold shadow-sm">D</div>
            <div className="leading-tight">
              <div className="font-semibold">Dentist</div>
              <div className="text-xs text-muted-foreground">Dashboard</div>
            </div>
          </div>
          <div className="mt-2">
            <SidebarInput placeholder="Search…" aria-label="Search" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          {/* Quick Actions */}
          <SidebarGroup className="px-2">
            <div className="grid grid-cols-2 gap-2">
              <SidebarMenuButton
                size="sm"
                variant="outline"
                onClick={() => handleNav("/clinical/schedule")}
                aria-label={t.navSchedule}
              >
                <Calendar className="h-4 w-4" />
                <span>{t.navSchedule}</span>
              </SidebarMenuButton>
              <SidebarMenuButton
                size="sm"
                variant="outline"
                onClick={() => handleNav("/clinical/patients")}
                aria-label={t.navPatients}
              >
                <Users className="h-4 w-4" />
                <span>{t.navPatients}</span>
              </SidebarMenuButton>
            </div>
          </SidebarGroup>
          <SidebarSeparator />
          <nav aria-label="Primary" onKeyDown={onKeyDownNav} ref={navRef}>
            {groups.map((group) => (
              <section key={group.id} aria-labelledby={`group-${group.id}`}>
                <SidebarGroup>
                  <SidebarGroupLabel className="flex items-center justify-between pr-8" role="button" tabIndex={0} aria-expanded={!!openGroups[group.id]} aria-controls={`group-content-${group.id}`} onClick={() => toggleGroup(group.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleGroup(group.id); } }}>
                    <span className="flex items-center gap-2" id={`group-${group.id}`}>
                      {group.id === "clinical" && <Stethoscope className="h-4 w-4" />}
                      {group.id === "business" && <BarChart3 className="h-4 w-4" />}
                      {group.id === "operations" && <Boxes className="h-4 w-4" />}
                      {group.id === "admin" && <Shield className="h-4 w-4" />}
                      <span>{group.label}</span>
                    </span>
                    <SidebarGroupAction aria-hidden="true">
                      <ChevronDown className={cn("h-4 w-4 transition-transform", openGroups[group.id] ? "rotate-0" : "-rotate-90")} />
                    </SidebarGroupAction>
                  </SidebarGroupLabel>
                  <div
                    id={`group-content-${group.id}`}
                    role="region"
                    aria-labelledby={`group-${group.id}`}
                    className={cn(
                      "overflow-hidden transition-all duration-200 ease-in-out",
                      openGroups[group.id] ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    )}
                  >
                    {openGroups[group.id] && (
                      <SidebarGroupContent>
                        <SidebarMenu>
                          {group.items.map((item) => {
                          const active = (location.pathname + location.search + location.hash).startsWith(item.to);
                          const ariaLabel = typeof item.badge === 'number' && item.badge > 0
                            ? `Group: ${group.label}, item: ${item.label}, ${item.badge} due.`
                            : `Group: ${group.label}, item: ${item.label}.`;
                          return (
                            <SidebarMenuItem key={item.id}>
                              <SidebarMenuButton data-group-id={group.id} tooltip={item.label} isActive={active} aria-label={ariaLabel} onClick={() => handleNav(item.to)} className="rounded-md">
                                {item.icon}
                                <span>{item.label}</span>
                              </SidebarMenuButton>
                              {typeof item.badge === 'number' && item.badge > 0 && (
                                <SidebarMenuBadge aria-label={`${item.label}, ${item.badge} due`}>{item.badge}</SidebarMenuBadge>
                              )}
                            </SidebarMenuItem>
                          );
                        })}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    )}
                  </div>
                </SidebarGroup>
              </section>
            ))}
          </nav>
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 justify-start"
            >
              <Languages className="h-4 w-4 mr-2" />EN/FR/NL
            </Button>
            <SidebarTrigger
              className="h-8 w-8"
              aria-label="Collapse or expand sidebar"
              title="Collapse/Expand"
            />
          </div>
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

