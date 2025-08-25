import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  const tabGroups = [
    {
      id: 'clinical',
      title: 'Clinical',
      icon: Stethoscope,
      tabs: [
        { id: 'clinical' as TabType, label: 'Clinical', icon: Stethoscope },
      ]
    },
    {
      id: 'patients',
      title: 'Patients',
      icon: Users,
      tabs: [
        { id: 'patients' as TabType, label: 'Patients', icon: Users },
      ]
    },
    {
      id: 'business',
      title: 'Business',
      icon: BarChart3,
      tabs: [
        { id: 'payments' as TabType, label: 'Payments', icon: CreditCard },
        { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3 },
      ]
    },
    {
      id: 'data',
      title: 'Data',
      icon: Database,
      tabs: [
        { id: 'import' as TabType, label: 'Import', icon: Database },
      ]
    },
    {
      id: 'inventory',
      title: 'Inventory',
      icon: Package,
      tabs: [
        { id: 'inventory' as TabType, label: 'Inventory', icon: Package, badge: inventoryBadgeCount > 0 ? String(inventoryBadgeCount) : undefined },
      ]
    },
    {
      id: 'admin',
      title: 'Admin',
      icon: Settings,
      tabs: [
        { id: 'availability' as TabType, label: 'Schedule', icon: Clock },
        { id: 'manage' as TabType, label: 'Settings', icon: Settings },
        { id: 'debug' as TabType, label: 'Debug', icon: Database },
      ]
    }
  ];
  // Determine current group based on active tab
  const currentGroup = tabGroups.find(group => 
    group.tabs.some(tab => tab.id === activeTab)
  ) || tabGroups[0];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Section Header */}
      <div className="px-4 pt-4 space-y-4">
        <Card className="border-0 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-white/20 rounded-lg">
                  <currentGroup.icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{currentGroup.title}</h2>
                  <p className="text-primary-foreground/80 text-sm">
                    {currentGroup.tabs.find(t => t.id === activeTab)?.label || 'Dashboard'}
                  </p>
                </div>
              </div>
              {onSignOut && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onSignOut}
                  aria-label="Sign out"
                  title="Sign out"
                  className="text-primary-foreground hover:bg-white/10"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Switch Tabs within current group */}
        {currentGroup.tabs.length > 1 && (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className={`grid ${currentGroup.tabs.length === 2 ? 'grid-cols-2' : 'grid-cols-3'} gap-3`}>
                {currentGroup.tabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "outline"}
                    size="lg"
                    onClick={() => setActiveTab(tab.id)}
                    className="h-20 flex flex-col justify-center items-center space-y-2 rounded-xl relative touch-target p-3"
                  >
                    <tab.icon className="h-6 w-6" />
                    <span className="text-xs font-medium text-center leading-tight">{tab.label}</span>
                    {(tab as any).badge && (
                      <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                        {(tab as any).badge}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className="space-y-4 pb-4">
          {children}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/98 backdrop-blur-lg border-t border-border/50 safe-area-inset-bottom z-50">
        <div className="grid grid-cols-6 gap-2 p-3">
          {tabGroups.map((group) => {
            const isCurrentGroup = group.tabs.some(tab => tab.id === activeTab);
            const hasUrgentBadge = group.tabs.some(tab => (tab as any).badge);
            
            return (
              <Button
                key={group.id}
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!isCurrentGroup) {
                    setActiveTab(group.tabs[0].id);
                  }
                }}
                className={`h-16 flex flex-col justify-center items-center space-y-1 rounded-xl relative transition-all duration-200 touch-target ${
                  isCurrentGroup 
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-md' 
                    : 'text-muted-foreground hover:text-primary hover:bg-muted/50'
                }`}
              >
                <group.icon className={`h-5 w-5 ${isCurrentGroup ? 'scale-110' : ''}`} />
                <span className="text-[10px] font-medium">{group.title}</span>
                {hasUrgentBadge && (
                  <div className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-[10px] text-destructive-foreground font-bold">!</span>
                  </div>
                )}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}