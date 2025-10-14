import React, { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarSeparator, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/hooks/useLanguage";
import { Home, Calendar, Pill, FileText, CreditCard, Folder, User, IdCard, Shield, HelpCircle, ChevronDown, MoreHorizontal, PanelLeft, Settings as SettingsIcon, LogOut, Info } from "lucide-react";
import { usePatientBadgeCounts } from "@/hooks/usePatientBadges";
import { cn } from "@/lib/utils";
import { emitAnalyticsEvent } from "@/lib/analyticsEvents";
import { supabase } from "@/integrations/supabase/client";
import { LanguageSelector } from "@/components/LanguageSelector";

type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  to: string;
  badge?: number;
  tooltip?: string;
};

type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

const STORAGE_KEYS = {
  sidebarState: 'pnav:state',
  lastVisited: 'pnav:last',
  lastGroup: 'pnav:group',
};

function readSidebarCookie(): boolean {
  try {
    const match = document.cookie.match(/(?:^|; )sidebar:state=([^;]+)/);
    if (match) {
      return match[1] === 'true';
    }
  } catch {}
  return true;
}

export function PatientPortalNav({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { state, toggleSidebar } = useSidebar();
  const { counts } = usePatientBadgeCounts();
  const [openGroupId, setOpenGroupId] = useState<string | null>(() => localStorage.getItem(STORAGE_KEYS.lastGroup));
  const [moreOpen, setMoreOpen] = useState(false);
  const [defaultOpen, setDefaultOpen] = useState(true);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to sign out', error);
    }
  };

  useEffect(() => {
    const cookieOpen = readSidebarCookie();
    const w = window.innerWidth;
    const computed = w >= 1024 ? true : w >= 768 ? false : false;
    setDefaultOpen(typeof cookieOpen === 'boolean' ? cookieOpen : computed);
  }, []);

  useEffect(() => {
    if (openGroupId) localStorage.setItem(STORAGE_KEYS.lastGroup, openGroupId);
  }, [openGroupId]);

  // Groups and items per IA
  const groups: NavGroup[] = useMemo(() => [
    {
      id: 'care',
      label: t.pnav.group.care,
      items: [
        { id: 'care-home', label: t.pnav.care.home, icon: <Home className="h-4 w-4" />, to: '/care' },
        { id: 'care-appointments', label: t.pnav.care.appointments, icon: <Calendar className="h-4 w-4" />, to: '/care/appointments', badge: counts.upcoming7d },
        { id: 'care-prescriptions', label: t.pnav.care.prescriptions, icon: <Pill className="h-4 w-4" />, to: '/care/prescriptions' },
        { id: 'care-history', label: t.pnav.care.history, icon: <FileText className="h-4 w-4" />, to: '/care/history' },
      ],
    },
    {
      id: 'billing',
      label: t.pnav.group.billing,
      items: [
        { id: 'billing-main', label: t.pnav.billing.main, icon: <CreditCard className="h-4 w-4" />, to: '/billing', badge: counts.unpaid },
      ],
    },
    {
      id: 'documents',
      label: t.pnav.group.documents,
      items: [
        { id: 'docs-main', label: t.pnav.docs.main, icon: <Folder className="h-4 w-4" />, to: '/docs' },
      ],
    },
    {
      id: 'account',
      label: t.pnav.group.account,
      items: [
        { id: 'account-profile', label: t.pnav.account.profile, icon: <User className="h-4 w-4" />, to: '/account/profile' },
        { id: 'account-insurance', label: t.pnav.account.insurance, icon: <IdCard className="h-4 w-4" />, to: '/account/insurance' },
        { id: 'account-privacy', label: t.pnav.account.privacy, icon: <Shield className="h-4 w-4" />, to: '/account/privacy' },
        { id: 'account-help', label: t.pnav.account.help, icon: <HelpCircle className="h-4 w-4" />, to: '/account/help' },
      ],
    },
  ], [t, counts.upcoming7d, counts.unpaid]);

  // Deep link behavior: /billing?status=unpaid expands Billing
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    if (location.pathname.startsWith('/billing') && status) {
      setOpenGroupId('billing');
    }
  }, [location.pathname, location.search]);

  const handleNav = (groupId: string, item: NavItem, e: React.MouseEvent) => {
    try { localStorage.setItem(STORAGE_KEYS.lastVisited, item.to); } catch {}
    try { emitAnalyticsEvent('pnav_click', '', { role: 'patient', group: groupId, item: item.id, path: item.to }); } catch {}
    if (isMobile) setMoreOpen(false);
  };

  // Restore last item on mount
  useEffect(() => {
    const last = localStorage.getItem(STORAGE_KEYS.lastVisited);
    if (last && location.pathname === '/dashboard') {
      navigate(last);
    }
  }, []);

  // Keyboard navigation within nav (up/down to move, left/right to collapse/expand)
  const navRef = useRef<HTMLDivElement | null>(null);
  const onKeyDownNav = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const container = navRef.current;
    if (!container) return;
    const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>("[data-sidebar='menu-button']"));
    const activeEl = document.activeElement as HTMLElement | null;
    const index = buttons.findIndex((b) => b === activeEl);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = buttons[Math.min(buttons.length - 1, index + 1)] || buttons[0];
      next?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = buttons[Math.max(0, index - 1)] || buttons[buttons.length - 1];
      prev?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const gid = activeEl?.getAttribute('data-group-id') || '';
      if (gid) {
        e.preventDefault();
        const wantExpand = e.key === 'ArrowRight';
        const isExpanded = openGroupId === gid;
        if ((wantExpand && !isExpanded) || (!wantExpand && isExpanded)) {
          setOpenGroupId((prev) => (prev === gid ? null : gid));
        }
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (activeEl && activeEl.getAttribute('data-sidebar') === 'menu-button') {
        e.preventDefault();
        (activeEl as HTMLButtonElement).click();
      }
    }
  };

  const navContent = (
    <>
      <SidebarHeader className="px-3 py-3">
        <div className="flex items-center gap-2 px-1">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-pill)] bg-[hsl(var(--brand-100))] text-[hsl(var(--brand-600))] font-semibold">P</span>
          <span className="font-semibold">Patient</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label="Primary" onKeyDown={onKeyDownNav} ref={navRef}>
          {groups.map((group) => (
            <section key={group.id} aria-labelledby={`group-${group.id}`}>
              <SidebarGroup>
                <SidebarGroupLabel
                  className="flex items-center justify-between pr-8"
                  role="button"
                  tabIndex={0}
                  aria-expanded={openGroupId === group.id}
                  aria-controls={`group-content-${group.id}`}
                  onClick={() => setOpenGroupId(prev => prev === group.id ? null : group.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenGroupId(prev => prev === group.id ? null : group.id); } }}
                >
                  <span id={`group-${group.id}`}>{group.label}</span>
                  <SidebarGroupAction aria-hidden="true">
                    <ChevronDown className={cn("h-4 w-4 transition-transform", openGroupId === group.id ? "rotate-0" : "-rotate-90")} />
                  </SidebarGroupAction>
                </SidebarGroupLabel>
                <div
                  id={`group-content-${group.id}`}
                  role="region"
                  aria-labelledby={`group-${group.id}`}
                  className={cn("overflow-hidden transition-all duration-200 ease-in-out", openGroupId === group.id ? "max-h-96 opacity-100" : "max-h-0 opacity-0")}
                >
                  {openGroupId === group.id && (
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {group.items.map((item) => (
                          <SidebarMenuItem key={item.id}>
                            <SidebarMenuButton asChild data-group-id={group.id} tooltip={item.label}>
                              <NavLink
                                to={item.to}
                                end={item.to === '/care'}
                                onClick={(e) => handleNav(group.id, item, e)}
                                aria-label={item.label}
                                className={({ isActive }) => cn(isActive && "bg-sidebar-accent text-sidebar-accent-foreground")}
                              >
                                {item.icon}
                                <span>{item.label}</span>
                              </NavLink>
                            </SidebarMenuButton>
                            {typeof item.badge !== 'undefined' && item.badge > 0 && (
                              <SidebarMenuBadge aria-label={`${item.label}, ${item.badge} pending`}>{item.badge}</SidebarMenuBadge>
                            )}
                          </SidebarMenuItem>
                        ))}
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
          <LanguageSelector />
          <SidebarTrigger className="h-8 w-8" aria-label="Collapse or expand sidebar" title="Collapse/Expand" />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </>
  );

  // Mobile: bottom tabs with More opening full-height drawer showing same content
  if (isMobile) {
    const haptic = () => { try { (navigator as any)?.vibrate?.(10); } catch {} };
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1">{children ?? <Outlet />}</div>
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t">
          <div className="grid grid-cols-4">
            <NavLink to="/care" end onClick={haptic} className={({ isActive }) => cn("py-2 flex flex-col items-center", isActive ? 'text-primary' : 'text-muted-foreground')} aria-label="Home">
              <Home className="h-5 w-5" />
              <span className="text-xs">{t.pnav.care.home}</span>
            </NavLink>
            <NavLink to="/care/appointments" onClick={haptic} className={({ isActive }) => cn("py-2 flex flex-col items-center relative", isActive ? 'text-primary' : 'text-muted-foreground')} aria-label="Appointments">
              <div className="relative">
                <Calendar className="h-5 w-5" />
                {counts.upcoming7d > 0 && <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 rounded-full" />}
              </div>
              <span className="text-xs">{t.pnav.care.appointments}</span>
            </NavLink>
            <NavLink to="/billing" onClick={haptic} className={({ isActive }) => cn("py-2 flex flex-col items-center relative", isActive ? 'text-primary' : 'text-muted-foreground')} aria-label="Billing">
              <div className="relative">
                <CreditCard className="h-5 w-5" />
                {counts.unpaid > 0 && <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 rounded-full" />}
              </div>
              <span className="text-xs">{t.pnav.group.billing}</span>
            </NavLink>
            <button className="py-2 flex flex-col items-center text-muted-foreground" onClick={() => { haptic(); setMoreOpen(true); }} aria-label="More">
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-xs">More</span>
            </button>
          </div>
        </nav>
        <Drawer shouldScaleBackground={true} open={moreOpen} onOpenChange={setMoreOpen}>
          <DrawerContent>
            <div className="max-h-[90vh] overflow-auto p-2">
              <SidebarProvider defaultOpen style={{ ['--sidebar-width' as any]: '17.5rem', ['--sidebar-width-icon' as any]: '4.5rem' }}>
                <div className="md:hidden">{navContent}</div>
              </SidebarProvider>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    );
  }

  // Desktop collapsible sidebar
  return (
    <SidebarProvider defaultOpen={defaultOpen} style={{ ['--sidebar-width' as any]: '17.5rem', ['--sidebar-width-icon' as any]: '4.5rem' }}>
      <div className="flex">
        <Sidebar collapsible="icon">
          {navContent}
        </Sidebar>
        <div className="flex-1">
          <div className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="md:hidden" />
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
            </div>
            <div className="flex items-center gap-2">
              <LanguageSelector />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2" aria-label="Open menu" title="Menu">
                    <SettingsIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate('/account/profile')} aria-label="Profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/about')} aria-label="About">
                    <Info className="mr-2 h-4 w-4" />
                    About
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
          <div className="p-3 md:p-4">{children ?? <Outlet />}</div>
        </div>
      </div>
    </SidebarProvider>
  );
}

