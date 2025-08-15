import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Home as HomeIcon,
  Stethoscope,
  Calendar,
  CreditCard,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export type PatientSection = 'home' | 'care' | 'appointments' | 'payments' | 'settings';

interface PatientAppShellProps {
  activeSection: PatientSection;
  onChangeSection: (section: PatientSection) => void;
  children: React.ReactNode;
  badges?: Partial<Record<PatientSection, boolean>>;
}

const NAV_ITEMS: Array<{ id: PatientSection; label: string; icon: React.ComponentType<any> }> = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'care', label: 'Care', icon: Stethoscope },
  { id: 'appointments', label: 'Appointments', icon: Calendar },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export const PatientAppShell: React.FC<PatientAppShellProps> = ({
  activeSection,
  onChangeSection,
  children,
  badges = {},
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isActive = (id: PatientSection) => activeSection === id;

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop left sidebar */}
      <div className="hidden md:flex h-screen">
        <div className={cn(
          "border-r border-border bg-card flex flex-col transition-all duration-200",
          sidebarCollapsed ? "w-16" : "w-64"
        )}>
          <div className="flex items-center justify-between px-3 py-3 border-b border-border">
            {!sidebarCollapsed && (
              <div className="font-semibold text-sm">Patient</div>
            )}
            <Button variant="ghost" size="icon" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
          <nav className="p-2 space-y-1">
            <TooltipProvider>
              {NAV_ITEMS.map(item => {
                const Icon = item.icon;
                const active = isActive(item.id);
                const showDot = badges[item.id];
                const navButton = (
                  <Button
                    key={item.id}
                    variant={active ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start relative",
                      active && "bg-primary/10 text-primary hover:bg-primary/15"
                    )}
                    onClick={() => onChangeSection(item.id)}
                  >
                    <Icon className={cn("h-5 w-5", !sidebarCollapsed && "mr-3")} />
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    {showDot && (
                      <span className="absolute right-2 top-1 h-2 w-2 rounded-full bg-destructive" />
                    )}
                  </Button>
                );

                return sidebarCollapsed ? (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>{navButton}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                ) : (
                  <div key={item.id}>{navButton}</div>
                );
              })}
            </TooltipProvider>
          </nav>
        </div>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Mobile layout with bottom nav */}
      <div className="md:hidden">
        <div className="pb-20">{children}</div>
        <div className="fixed bottom-0 left-0 right-0 bg-background/98 backdrop-blur border-t border-border z-50">
          <div className="grid grid-cols-5 gap-1 p-2">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const active = isActive(item.id);
              const showDot = badges[item.id];
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => onChangeSection(item.id)}
                  className={cn(
                    "h-14 flex flex-col items-center justify-center rounded-lg relative",
                    active ? "text-primary bg-primary/10" : "text-muted-foreground"
                  )}
                >
                  <Icon className={cn("h-5 w-5", active && "scale-110")} />
                  <span className="text-[11px] mt-1">{item.label}</span>
                  {showDot && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive" />)
                  }
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};