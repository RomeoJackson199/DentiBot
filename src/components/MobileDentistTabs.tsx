import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Stethoscope,
  ChevronRight
} from "lucide-react";

type TabType = 'urgency' | 'availability' | 'appointments' | 'patients' | 'payments' | 'analytics' | 'manage' | 'debug' | 'prescriptions' | 'treatment-plans';

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
        { id: 'urgency' as TabType, label: 'Triage', icon: AlertTriangle, badge: '!' },
        { id: 'appointments' as TabType, label: 'Appointments', icon: Calendar },
        { id: 'patients' as TabType, label: 'Patients', icon: Users },
      ]
    },
    {
      id: 'treatment',
      title: 'Treatment',
      icon: FileText,
      tabs: [
        { id: 'prescriptions' as TabType, label: 'Prescriptions', icon: Pill },
        { id: 'treatment-plans' as TabType, label: 'Treatment Plans', icon: FileText },
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/30">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="w-full">
          <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b">
            <TabsList className="grid w-full grid-cols-4 gap-1 p-2 h-auto bg-transparent">
              {tabGroups.map((group) => (
                <TabsTrigger
                  key={group.id}
                  value={group.tabs.find(tab => tab.id === activeTab)?.id || group.tabs[0].id}
                  className="flex flex-col items-center p-3 space-y-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all duration-200"
                  onClick={() => {
                    const currentTab = group.tabs.find(tab => tab.id === activeTab);
                    if (!currentTab) {
                      setActiveTab(group.tabs[0].id);
                    }
                  }}
                >
                  <group.icon className="h-5 w-5" />
                  <span className="text-xs font-medium truncate">{group.title}</span>
                  {group.tabs.some(tab => tab.badge && tab.id === activeTab) && (
                    <Badge variant="destructive" className="h-4 w-4 p-0 text-xs">!</Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {tabGroups.map((group) => (
            group.tabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="p-4 space-y-4">
                {/* Quick Actions for current group */}
                <Card className={`${cardClass} border-0 shadow-lg bg-card/60 backdrop-blur-sm`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-lg">
                      <group.icon className="h-5 w-5 mr-2 text-primary" />
                      {group.title} Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 gap-2">
                    {group.tabs.map((groupTab) => (
                      <Button
                        key={groupTab.id}
                        variant={activeTab === groupTab.id ? "default" : "ghost"}
                        size="lg"
                        onClick={() => setActiveTab(groupTab.id)}
                        className="justify-between h-12 rounded-xl transition-all duration-200"
                      >
                        <div className="flex items-center">
                          <groupTab.icon className="h-5 w-5 mr-3" />
                          <span className="font-medium">{groupTab.label}</span>
                        </div>
                        {groupTab.badge && (
                          <Badge variant="destructive" className="ml-2">
                            {groupTab.badge}
                          </Badge>
                        )}
                        <ChevronRight className="h-4 w-4 opacity-50" />
                      </Button>
                    ))}
                  </CardContent>
                </Card>
                
                {/* Main Content */}
                <div className="space-y-4">
                  {children}
                </div>
              </TabsContent>
            ))
          ))}
        </Tabs>
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