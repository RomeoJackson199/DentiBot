import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMobileOptimizations } from "@/components/mobile/MobileOptimizations";
import { cn } from "@/lib/utils";
import { 
  Clock, 
  Calendar, 
  Users, 
  CreditCard, 
  BarChart3, 
  Settings, 
  Database,
  Stethoscope,
  Package
} from "lucide-react";

type TabType = 'clinical' | 'patients' | 'payments' | 'analytics' | 'availability' | 'manage' | 'debug' | 'inventory' | 'import' | 'recalls';

interface MobileDentistTabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  dentistId: string;
  children: React.ReactNode;
  inventoryBadgeCount?: number;
}

export function MobileDentistTabs({ activeTab, setActiveTab, dentistId, children, inventoryBadgeCount = 0 }: MobileDentistTabsProps) {
  const { isMobile, cardClass } = useMobileOptimizations();

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

  if (isMobile) {
    // Get current group based on active tab
    const currentGroup = tabGroups.find(group => 
      group.tabs.some(tab => tab.id === activeTab)
    ) || tabGroups[0];

    return (
      <div className="min-h-screen bg-background pb-24">
        {/* Mobile Tab Content */}
        <div className="px-4 pt-4 space-y-4">
          {/* Current Section Header */}
          <Card className="border-0 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-xl">
            <CardContent className="p-5">
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
            </CardContent>
          </Card>

          {/* Quick Switch Tabs within current group - Improved spacing */}
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

        {/* Bottom Navigation - Improved height and spacing */}
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
                    // Switch to first tab of the group if not already in this group
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

  // Desktop layout with sidebar
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/10 flex">
      {/* Desktop Sidebar */}
      <div className="fixed left-0 top-20 bottom-0 w-72 bg-card/80 backdrop-blur-lg border-r border-border/50 z-header">
        {/* Sidebar Header */}
        <div className="flex items-center space-x-3 p-6 border-b border-border/50">
          <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">D</span>
          </div>
          <div>
            <h1 className="font-semibold text-lg">Denti Dashboard</h1>
            <p className="text-sm text-muted-foreground">Dentist Portal</p>
          </div>
        </div>

        {/* Navigation Groups */}
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

      {/* Main Content Area */}
      <div className="flex-1 ml-72 pt-20">
        <div className="min-h-screen p-6">
          {children}
        </div>
      </div>
    </div>
  );
}