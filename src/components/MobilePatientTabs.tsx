import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMobileOptimizations } from "@/components/mobile/MobileOptimizations";
import {
  Stethoscope,
  Calendar,
  AlertTriangle,
  Pill,
  ClipboardList,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  MessageCircle
} from "lucide-react";

export type PatientTabType =
  | 'overview'
  | 'chat'
  | 'appointments'
  | 'prescriptions'
  | 'treatment'
  | 'records'
  | 'notes'
  | 'payments'
  | 'analytics'
  | 'emergency'
  | 'test';

interface MobilePatientTabsProps {
  activeTab: PatientTabType;
  setActiveTab: (tab: PatientTabType) => void;
  children: React.ReactNode;
}

export function MobilePatientTabs({ activeTab, setActiveTab, children }: MobilePatientTabsProps) {
  const { isMobile } = useMobileOptimizations();

  const tabGroups = [
    {
      id: 'home',
      title: 'Home',
      icon: Stethoscope,
      tabs: [
        { id: 'overview' as PatientTabType, label: 'Dashboard', icon: Stethoscope },
        { id: 'chat' as PatientTabType, label: 'AI Chat', icon: MessageCircle },
        { id: 'appointments' as PatientTabType, label: 'Appointments', icon: Calendar },
        { id: 'emergency' as PatientTabType, label: 'Emergency', icon: AlertTriangle, badge: '!' }
      ]
    },
    {
      id: 'treatment',
      title: 'Treatment',
      icon: ClipboardList,
      tabs: [
        { id: 'prescriptions' as PatientTabType, label: 'Prescriptions', icon: Pill },
        { id: 'treatment' as PatientTabType, label: 'Plans', icon: ClipboardList }
      ]
    },
    {
      id: 'records',
      title: 'Records',
      icon: FileText,
      tabs: [
        { id: 'records' as PatientTabType, label: 'Medical', icon: FileText },
        { id: 'notes' as PatientTabType, label: 'Notes', icon: FileText }
      ]
    },
    {
      id: 'insights',
      title: 'Insights',
      icon: BarChart3,
      tabs: [
        { id: 'payments' as PatientTabType, label: 'Payments', icon: CreditCard },
        { id: 'analytics' as PatientTabType, label: 'Analytics', icon: BarChart3 },
        { id: 'test' as PatientTabType, label: 'Test', icon: Settings }
      ]
    }
  ];

  if (isMobile) {
    const currentGroup = tabGroups.find(group => group.tabs.some(tab => tab.id === activeTab)) || tabGroups[0];

    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="px-4 pt-4 space-y-4">
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

          <div className="space-y-4 pb-4">
            {children}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-background/98 backdrop-blur-lg border-t border-border/50 safe-area-inset-bottom z-50">
          <div className="grid grid-cols-4 gap-1 p-3">
            {tabGroups.map((group) => {
              const isCurrentGroup = group.tabs.some(tab => tab.id === activeTab);
              const hasUrgentBadge = group.tabs.some(tab => tab.badge);

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

  return (
    <div className="min-h-screen mesh-bg">
      <main className="container mx-auto px-4 py-6">
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

        <div className="animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}