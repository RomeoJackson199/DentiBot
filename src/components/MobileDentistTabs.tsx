import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMobileOptimizations } from "@/components/mobile/MobileOptimizations";
import { 
  Clock, 
  Calendar, 
  Users, 
  CreditCard, 
  BarChart3, 
  Settings, 
  Database,
  Stethoscope
} from "lucide-react";

type TabType = 'clinical' | 'patients' | 'payments' | 'analytics' | 'availability' | 'manage' | 'debug';

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
      <div className="min-h-screen bg-background pb-24 safe-bottom">
        {/* Mobile Tab Content */}
        <div className="px-4 pt-6 space-y-6">
          {/* Current Section Header */}
          <Card className="border-0 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <currentGroup.icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{currentGroup.title}</h2>
                  <p className="text-primary-foreground/80 text-base">
                    {currentGroup.tabs.find(t => t.id === activeTab)?.label || 'Dashboard'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Switch Tabs within current group */}
          {currentGroup.tabs.length > 1 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  {currentGroup.tabs.map((tab) => (
                    <Button
                      key={tab.id}
                      variant={activeTab === tab.id ? "default" : "outline"}
                      size="lg"
                      onClick={() => setActiveTab(tab.id)}
                      className="h-20 flex flex-col space-y-2 rounded-xl relative transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                      <tab.icon className="h-6 w-6" />
                      <span className="text-sm font-medium text-center leading-tight">{tab.label}</span>
                      {tab.badge && (
                        <Badge variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 p-0 text-xs">
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
          <div className="space-y-6 pb-6">
            {children}
          </div>
        </div>

        {/* Enhanced Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/98 backdrop-blur-lg border-t border-border/50 safe-bottom z-50">
          <div className="grid grid-cols-4 gap-2 p-4">
            {tabGroups.map((group) => {
              const isCurrentGroup = group.tabs.some(tab => tab.id === activeTab);
              const hasUrgentBadge = group.tabs.some(tab => (tab as any).badge);
              
              return (
                <Button
                  key={group.id}
                  variant="ghost"
                  size="lg"
                  onClick={() => {
                    // Switch to first tab of the group if not already in this group
                    if (!isCurrentGroup) {
                      setActiveTab(group.tabs[0].id);
                    }
                  }}
                  className={`h-16 flex flex-col space-y-1 rounded-xl relative transition-all duration-200 touch-feedback ${
                    isCurrentGroup 
                      ? 'bg-primary/15 text-primary border-2 border-primary/30 shadow-lg' 
                      : 'text-muted-foreground hover:text-primary hover:bg-muted/50'
                  }`}
                >
                  <group.icon className={`h-6 w-6 ${isCurrentGroup ? 'scale-110' : ''}`} />
                  <span className="text-xs font-semibold truncate">{group.title}</span>
                  {hasUrgentBadge && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 bg-destructive rounded-full flex items-center justify-center">
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

  // Enhanced Desktop version with improved grouping and spacing
  return (
    <div className="min-h-screen mesh-bg">
      <main className="container mx-auto px-6 py-8">
        {/* Grouped Tab Navigation for Desktop */}
        <div className="flex justify-center mb-10">
          <div className="glass-card rounded-3xl p-6 animate-fade-in max-w-7xl w-full">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {tabGroups.map((group) => (
                <Card key={group.id} className="border-0 bg-background/50 backdrop-blur-sm hover:bg-background/70 transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center text-base font-semibold text-muted-foreground">
                      <group.icon className="h-5 w-5 mr-3" />
                      {group.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {group.tabs.map((tab) => (
                      <Button
                        key={tab.id}
                        variant={activeTab === tab.id ? 'default' : 'ghost'}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full justify-start h-12 rounded-xl transition-all duration-300 hover:scale-105 ${
                          activeTab === tab.id 
                            ? 'bg-gradient-primary text-white shadow-elegant scale-105' 
                            : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                        }`}
                      >
                        <tab.icon className="h-5 w-5 mr-3" />
                        <span className="font-medium text-base">{tab.label}</span>
                        {(tab as any).badge && (
                          <Badge variant="destructive" className="ml-auto">
                            {(tab as any).badge}
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

        {/* Content with improved spacing */}
        <div className="animate-fade-in space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}