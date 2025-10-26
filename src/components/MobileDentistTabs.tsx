import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMobileOptimizations } from "@/components/mobile/MobileOptimizations";
import { cn } from "@/lib/utils";
import { useBusinessTemplate } from "@/hooks/useBusinessTemplate";
import { useMemo } from "react";
import { 
  Clock, 
  Calendar, 
  Users, 
  CreditCard, 
  BarChart3, 
  Settings, 
  Database,
  Stethoscope,
  Package,
  LogOut
} from "lucide-react";

type TabType = 'clinical' | 'patients' | 'payments' | 'analytics' | 'availability' | 'manage' | 'debug' | 'inventory' | 'import' | 'recalls';

interface MobileDentistTabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  dentistId: string;
  children: React.ReactNode;
  inventoryBadgeCount?: number;
  onSignOut?: () => void;
}

export function MobileDentistTabs({ activeTab, setActiveTab, dentistId, children, inventoryBadgeCount = 0, onSignOut }: MobileDentistTabsProps) {
  const { isMobile, cardClass } = useMobileOptimizations();
  const { hasFeature, t } = useBusinessTemplate();

  const tabGroups = useMemo(() => {
    const groups = [];

    // Clinical - only if medical features are enabled
    if (hasFeature('medicalRecords') || hasFeature('prescriptions') || hasFeature('treatmentPlans')) {
      groups.push({
        id: 'clinical',
        title: 'Clinical',
        icon: Stethoscope,
        tabs: [
          { id: 'clinical' as TabType, label: 'Clinical', icon: Stethoscope },
        ]
      });
    }

    // Customers/Patients - always visible
    groups.push({
      id: 'patients',
      title: t('customerPlural'),
      icon: Users,
      tabs: [
        { id: 'patients' as TabType, label: t('customerPlural'), icon: Users },
      ]
    });

    // Business - always visible if payment features enabled
    if (hasFeature('paymentRequests')) {
      groups.push({
        id: 'business',
        title: 'Business',
        icon: BarChart3,
        tabs: [
          { id: 'payments' as TabType, label: 'Payments', icon: CreditCard },
          { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3 },
        ]
      });
    }

    // Data import - always visible
    groups.push({
      id: 'data',
      title: 'Data',
      icon: Database,
      tabs: [
        { id: 'import' as TabType, label: 'Import', icon: Database },
      ]
    });

    // Inventory - always visible
    groups.push({
      id: 'inventory',
      title: 'Inventory',
      icon: Package,
      tabs: [
        { id: 'inventory' as TabType, label: 'Inventory', icon: Package, badge: inventoryBadgeCount > 0 ? String(inventoryBadgeCount) : undefined },
      ]
    });

    // Admin - always visible
    groups.push({
      id: 'admin',
      title: 'Admin',
      icon: Settings,
      tabs: [
        { id: 'availability' as TabType, label: 'Schedule', icon: Clock },
        { id: 'manage' as TabType, label: 'Settings', icon: Settings },
        { id: 'debug' as TabType, label: 'Debug', icon: Database },
      ]
    });

    return groups;
  }, [hasFeature, t, inventoryBadgeCount]);

  // Always render the desktop-style sidebar layout on all devices
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/10 flex">
      <div className="fixed left-0 top-20 bottom-0 w-72 bg-card/80 backdrop-blur-lg border-r border-border/50 z-header">
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <div>
              <h1 className="font-semibold text-lg">Denti Dashboard</h1>
              <p className="text-sm text-muted-foreground">Dentist Portal</p>
            </div>
          </div>
          {onSignOut && (
            <Button
              variant="outline"
              size="icon"
              onClick={onSignOut}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="p-4 space-y-6 overflow-y-auto h-[calc(100vh-200px)]">
          {tabGroups.map((group) => {
            const GroupIcon = group.icon;
            return (
              <div key={group.id} className="space-y-2">
                <div className="flex items-center space-x-2 px-2 py-1">
                  <GroupIcon className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    {group.title}
                  </h3>
                </div>
                <div className="space-y-1">
                  {group.tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = tab.id === activeTab;
                    const hasBadge = (tab as any).badge;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all relative group",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{tab.label}</span>
                        {hasBadge && (
                          <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {hasBadge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 ml-72 pt-20">
        <div className="min-h-screen p-6">
          {children}
        </div>
      </div>
    </div>
  );
}