import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMobileOptimizations } from "@/components/mobile/MobileOptimizations";
import { 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Users, 
  CreditCard, 
  BarChart3, 
  Settings, 
  Database,
  FileText,
  Pill,
  Stethoscope
} from "lucide-react";

type TabType = 'urgency' | 'appointments' | 'patients' | 'payments' | 'analytics' | 'availability' | 'manage' | 'debug';

interface MobileDentistTabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  dentistId: string;
  children: React.ReactNode;
}

export function MobileDentistTabs({ activeTab, setActiveTab, dentistId, children }: MobileDentistTabsProps) {
  const { isMobile, cardClass } = useMobileOptimizations();

  const tabGroups = [
    {
      id: 'clinical',
      title: 'Clinical – Complete Flow',
      icon: Stethoscope,
      tabs: [
        { id: 'urgency' as TabType, label: 'Triage', icon: AlertTriangle, badge: '!' },
        { id: 'appointments' as TabType, label: 'Appointments', icon: Calendar },
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
      <div className="min-h-screen bg-background pb-20">
        {/* Mobile Tab Content */}
        <div className="px-4 pt-4 space-y-4">
          {/* Current Section Header */}
          <Card className="border-0 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <currentGroup.icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{currentGroup.title}</h2>
                  <p className="text-primary-foreground/80 text-sm">
                    {currentGroup.tabs.find(t => t.id === activeTab)?.label || 'Dashboard'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Switch Tabs within current group */}
          {currentGroup.tabs.length > 1 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-3">
                <div className="grid grid-cols-2 gap-2">
                  {currentGroup.tabs.map((tab) => (
                    <Button
                      key={tab.id}
                      variant={activeTab === tab.id ? "default" : "outline"}
                      size="lg"
                      onClick={() => setActiveTab(tab.id)}
                      className="h-16 flex flex-col space-y-1 rounded-lg relative"
                    >
                      <tab.icon className="h-5 w-5" />
                      <span className="text-xs font-medium text-center leading-tight">{tab.label}</span>
                      {tab.badge && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                          {tab.badge}
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
          <div className="grid grid-cols-4 gap-1 p-3">
            {tabGroups.map((group) => {
              const isCurrentGroup = group.id === currentGroup.id;
              const hasUrgentBadge = group.tabs.some(tab => tab.badge);
              
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
                  className={`h-14 flex flex-col space-y-0.5 rounded-lg relative transition-all duration-200 ${
                    isCurrentGroup 
                      ? 'bg-primary/10 text-primary border border-primary/20' 
                      : 'text-muted-foreground hover:text-primary hover:bg-muted/50'
                  }`}
                >
                  <group.icon className={`h-5 w-5 ${isCurrentGroup ? 'scale-110' : ''}`} />
                  <span className="text-xs font-medium truncate">{group.title}</span>
                  {hasUrgentBadge && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full flex items-center justify-center">
                      <span className="text-xs text-destructive-foreground font-bold">!</span>
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

  // Desktop version with improved grouping
  return (
    <div className="min-h-screen mesh-bg">
      <main className="container mx-auto px-4 py-6">
        {/* Grouped Tab Navigation for Desktop */}
        <div className="flex justify-center mb-8">
          <div className="glass-card rounded-3xl p-4 animate-fade-in max-w-6xl w-full">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {tabGroups.map((group) => (
                <Card key={group.id} className="border-0 bg-background/50 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-sm font-semibold text-muted-foreground">
                      <group.icon className="h-4 w-4 mr-2" />
                      {group.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {group.tabs.map((tab) => (
                      <Button
                        key={tab.id}
                        variant={activeTab === tab.id ? 'default' : 'ghost'}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full justify-start h-10 rounded-xl transition-all duration-300 ${
                          activeTab === tab.id 
                            ? 'bg-gradient-primary text-white shadow-elegant scale-105' 
                            : 'text-muted-foreground hover:text-primary hover:bg-primary/10 hover:scale-105'
                        }`}
                      >
                        <tab.icon className="h-4 w-4 mr-2" />
                        <span className="font-medium">{tab.label}</span>
                        {tab.badge && (
                          <Badge variant="destructive" className="ml-auto">
                            {tab.badge}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}