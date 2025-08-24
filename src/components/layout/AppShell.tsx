import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Stethoscope,
  Calendar,
  Users,
  Clock,
  Wallet,
  BarChart3,
  FileBarChart,
  Boxes,
  Upload,
  Settings,
  Globe,
  Shield,
  CalendarCog,
  Languages,
  Search,
  Building2,
  Bell,
  ChevronDown,
  Home,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const OPEN_GROUPS_KEY = "nav:open-groups";
const LAST_ITEM_KEY = "nav:last-item";
const COLLAPSED_KEY = "nav:collapsed";

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
          <CommandItem onSelect={() => { onOpenChange(false); navigate("/clinical"); }}>Dashboard</CommandItem>
          <CommandItem onSelect={() => { onOpenChange(false); navigate("/business/analytics"); }}>Analytics</CommandItem>
          <CommandItem onSelect={() => { onOpenChange(false); navigate("/clinical/schedule"); }}>Schedule</CommandItem>
          <CommandItem onSelect={() => { onOpenChange(false); navigate("/ops/inventory"); }}>Inventory</CommandItem>
          <CommandItem onSelect={() => { onOpenChange(false); navigate("/business/payments"); }}>Payments</CommandItem>
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
  const navRef = useRef<HTMLDivElement | null>(null);

  useScrollRestoration();

  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;

  const [openGroups, setOpenGroups] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(OPEN_GROUPS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(OPEN_GROUPS_KEY, JSON.stringify(openGroups));
  }, [openGroups]);

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    try {
      const persisted = localStorage.getItem(COLLAPSED_KEY);
      if (persisted !== null) return persisted !== 'true';
    } catch { /* ignore */ }
    // Defaults: >=1024 expanded; 768–1023 collapsed; <768 handled by offcanvas
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1024) return true;
      if (window.innerWidth >= 768 && window.innerWidth < 1024) return false;
    }
    return true;
  });

  const setCollapsed = useCallback((collapsed: boolean) => {
    setSidebarOpen(!collapsed);
    try { localStorage.setItem(COLLAPSED_KEY, String(collapsed)); } catch { /* noop */ }
    // Optional analytics
    try { console.debug('nav_state_persisted', { collapsed }); } catch { /* noop */ }
  }, []);

  useEffect(() => {
    // Fire analytics on load
    try { console.debug('nav_state_persisted', { collapsed: !sidebarOpen ? true : false }); } catch { /* noop */ }
  }, []);

  const [paymentOverdue, setPaymentOverdue] = useState<number>(0);
  const [inventoryLow, setInventoryLow] = useState<number>(0);
  const [dentistId, setDentistId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!profile?.id) return;
        const { data: dentist } = await (supabase as any)
          .from('dentists')
          .select('id')
          .eq('profile_id', profile.id)
          .maybeSingle();
        if (dentist?.id) setDentistId(dentist.id);
      } catch { /* noop */ }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (!dentistId) return;
        // Overdue payments count
        const { count: overdueCount } = await (supabase as any)
          .from('payment_requests')
          .select('id', { count: 'exact', head: false })
          .eq('dentist_id', dentistId)
          .eq('status', 'overdue');
        setPaymentOverdue(overdueCount || 0);
        // Inventory low stock count
        const { data: items } = await (supabase as any)
          .from('inventory_items')
          .select('quantity, min_threshold')
          .eq('dentist_id', dentistId);
        const low = (items || []).filter((i: any) => i.quantity < i.min_threshold).length;
        setInventoryLow(low);
      } catch { /* noop */ }
    })();
  }, [dentistId]);

  const groups: NavGroup[] = useMemo(() => [
    {
      id: "clinical",
      label: "Clinical",
      items: [
        { label: "Dashboard", icon: <Stethoscope className="h-4 w-4" />, to: "/clinical", isActive: p => p.startsWith("/clinical") && (p === "/clinical" || p === "/clinical/") },
        { label: "Schedule", icon: <Calendar className="h-4 w-4" />, to: "/clinical/schedule" },
        { label: "Patients", icon: <Users className="h-4 w-4" />, to: "/clinical/patients" },
        { label: "Appointments", icon: <Clock className="h-4 w-4" />, to: "/clinical/appointments" },
      ],
    },
    {
      id: "business",
      label: "Business",
      items: [
        { label: "Payments", icon: <Wallet className="h-4 w-4" />, to: "/business/payments", badge: paymentOverdue > 0 ? paymentOverdue : undefined, isActive: p => p.startsWith("/business/payments") },
        { label: "Analytics", icon: <BarChart3 className="h-4 w-4" />, to: "/business/analytics" },
        { label: "Reports", icon: <FileBarChart className="h-4 w-4" />, to: "/business/reports" },
      ],
    },
    {
      id: "operations",
      label: "Operations",
      items: [
        { label: "Inventory", icon: <Boxes className="h-4 w-4" />, to: "/ops/inventory", badge: inventoryLow > 0 ? inventoryLow : undefined },
        { label: "Imports", icon: <Upload className="h-4 w-4" />, to: "/ops/imports" },
      ],
    },
    {
      id: "admin",
      label: "Admin",
      items: [
        { label: "Schedule Settings", icon: <CalendarCog className="h-4 w-4" />, to: "/admin/schedule" },
        { label: "Branding & Localization", icon: <Globe className="h-4 w-4" />, to: "/admin/branding" },
        { label: "Security", icon: <Shield className="h-4 w-4" />, to: "/admin/security" },
      ],
    },
  ], [paymentOverdue, inventoryLow]);

  const handleNav = (to: string, meta: { group: string; item: string }) => {
    try { localStorage.setItem(LAST_ITEM_KEY, to); } catch { /* noop */ }
    try { console.debug('nav_click', { role: 'dentist', group: meta.group, item: meta.item, path: to }); } catch { /* noop */ }
    navigate(to);
  };

  // Expand the correct group for deep-linked routes
  useEffect(() => {
    const path = location.pathname;
    const groupId = path.startsWith('/clinical') ? 'clinical' : path.startsWith('/business') ? 'business' : path.startsWith('/ops') ? 'operations' : path.startsWith('/admin') ? 'admin' : null;
    if (groupId && !openGroups.includes(groupId)) {
      setOpenGroups((prev) => [...prev, groupId]);
    }
  }, [location.pathname]);

  // Keyboard navigation within nav
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    const root = navRef.current;
    if (!root) return;
    const focusable = Array.from(root.querySelectorAll<HTMLButtonElement>('button[data-nav-item],button[data-group-toggle]'));
    const currentIndex = focusable.findIndex((el) => el === document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = focusable[(currentIndex + 1) % focusable.length] || focusable[0];
      next?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = focusable[(currentIndex - 1 + focusable.length) % focusable.length] || focusable[focusable.length - 1];
      prev?.focus();
    } else if (e.key === 'ArrowRight') {
      const el = document.activeElement as HTMLElement | null;
      if (el?.dataset.groupId) {
        const id = el.dataset.groupId;
        if (!openGroups.includes(id)) setOpenGroups((p) => [...p, id]);
      }
    } else if (e.key === 'ArrowLeft') {
      const el = document.activeElement as HTMLElement | null;
      if (el?.dataset.groupId) {
        const id = el.dataset.groupId;
        if (openGroups.includes(id)) setOpenGroups((p) => p.filter((g) => g !== id));
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      const el = document.activeElement as HTMLButtonElement | null;
      if (el?.dataset.href) {
        e.preventDefault();
        navigate(el.dataset.href);
      }
    }
  }, [openGroups, navigate]);

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={(open) => setCollapsed(!open)}>
      <Sidebar collapsible={isMobile ? "offcanvas" : "icon"} onMouseEnter={() => { if (!isMobile && isTablet && !sidebarOpen) setCollapsed(false); }} onMouseLeave={() => { if (!isMobile && isTablet) setCollapsed(true); }}>
        <SidebarHeader className="px-2 py-3">
          <div className="flex items-center gap-2 px-1">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-pill)] bg-[hsl(var(--brand-100))] text-[hsl(var(--brand-600))] font-semibold">D</span>
            <span className="font-semibold">Dentibot</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <nav aria-label="Primary" role="navigation" ref={navRef as any} onKeyDown={onKeyDown}>
            {groups.map((group) => {
              const isOpen = openGroups.includes(group.id);
              const groupLabelId = `group-${group.id}`;
              const contentId = `group-content-${group.id}`;
              return (
                <section key={group.id} aria-labelledby={groupLabelId}>
                  <SidebarGroup>
                    <SidebarGroupLabel asChild>
                      <button
                        id={groupLabelId}
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={contentId}
                        data-group-toggle
                        data-group-id={group.id}
                        className="flex items-center justify-between pr-8 focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-600))]"
                        onClick={() => {
                          setOpenGroups((prev) => {
                            const open = prev.includes(group.id) ? prev.filter((g) => g !== group.id) : [...prev, group.id];
                            try { console.debug('nav_toggle_group', { group: group.label, expanded: open.includes(group.id) }); } catch { /* noop */ }
                            return open;
                          });
                        }}
                      >
                        <span data-i18n-key={
                          group.id === 'clinical' ? 'nav.group.clinical' :
                          group.id === 'business' ? 'nav.group.business' :
                          group.id === 'operations' ? 'nav.group.operations' :
                          'nav.group.admin'
                        }>{group.label}</span>
                        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen ? "rotate-0" : "-rotate-90")} />
                      </button>
                    </SidebarGroupLabel>
                    {isOpen && (
                      <SidebarGroupContent id={contentId} role="group">
                        <SidebarMenu>
                          {group.items.map((item) => {
                            const active = item.isActive ? item.isActive(location.pathname + location.hash) : (location.pathname + location.hash).startsWith(item.to);
                            const aria = `Group: ${group.label}, item: ${item.label}${typeof item.badge !== 'undefined' ? `, ${item.badge} ${group.id === 'business' ? 'overdue' : 'low stock'}` : ''}`;
                            return (
                              <SidebarMenuItem key={item.label}>
                                <SidebarMenuButton
                                  tooltip={item.label}
                                  isActive={active}
                                  data-nav-item
                                  data-href={item.to}
                                  className={cn("focus-visible:ring-[hsl(var(--brand-600))] hover:bg-[hsl(var(--brand-100))] relative pl-2", active && "bg-transparent")}
                                  onClick={() => handleNav(item.to, { group: group.label, item: item.label })}
                                  aria-label={aria}
                                  aria-current={active ? 'page' : undefined}
                                >
                                  {/* Left active indicator */}
                                  <span aria-hidden className={cn("absolute left-0 top-1 bottom-1 w-1 rounded-r bg-[hsl(var(--brand-600))] transition-opacity", active ? "opacity-100" : "opacity-0")}></span>
                                  {item.icon}
                                  <span data-i18n-key={
                                    group.id === 'clinical' && item.label === 'Dashboard' ? 'nav.clinical.dashboard' :
                                    group.id === 'clinical' && item.label === 'Schedule' ? 'nav.clinical.schedule' :
                                    group.id === 'clinical' && item.label === 'Patients' ? 'nav.clinical.patients' :
                                    group.id === 'clinical' && item.label === 'Appointments' ? 'nav.clinical.appointments' :
                                    group.id === 'business' && item.label === 'Payments' ? 'nav.business.payments' :
                                    group.id === 'business' && item.label === 'Analytics' ? 'nav.business.analytics' :
                                    group.id === 'business' && item.label === 'Reports' ? 'nav.business.reports' :
                                    group.id === 'operations' && item.label === 'Inventory' ? 'nav.ops.inventory' :
                                    group.id === 'operations' && item.label === 'Imports' ? 'nav.ops.imports' :
                                    group.id === 'admin' && item.label === 'Schedule Settings' ? 'nav.admin.schedule' :
                                    group.id === 'admin' && item.label === 'Branding & Localization' ? 'nav.admin.branding' :
                                    group.id === 'admin' && item.label === 'Security' ? 'nav.admin.security' :
                                    undefined
                                  }>{item.label}</span>
                                </SidebarMenuButton>
                                {typeof item.badge !== 'undefined' && (
                                  <SidebarMenuBadge className="bg-red-100 text-red-800 border border-red-200">{item.badge}</SidebarMenuBadge>
                                )}
                              </SidebarMenuItem>
                            );
                          })}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    )}
                  </SidebarGroup>
                </section>
              );
            })}
          </nav>
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

