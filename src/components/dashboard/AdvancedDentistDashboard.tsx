import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LayoutDashboard, Users, MessageSquare, CheckSquare,
  BarChart3, Settings, Bell, Moon, Sun, Monitor,
  Shield, Activity, Zap
} from "lucide-react";
import { DashboardOverview } from "./DashboardOverview";
import { TaskBoard } from "./TaskBoard";
import { CommunicationHub } from "./CommunicationHub";
import { PatientProfileQuickAccess } from "./PatientProfileQuickAccess";
import { DentistAnalytics } from "../analytics/DentistAnalytics";

interface AdvancedDentistDashboardProps {
  dentistId: string;
}

export const AdvancedDentistDashboard = ({ dentistId }: AdvancedDentistDashboardProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="min-h-screen mesh-bg">
      {/* Enhanced Header with Real-time Alerts */}
      <header className="glass-card sticky top-0 z-50 border-0 border-b border-border/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="pulse-ring w-16 h-16 -top-4 -left-4"></div>
              <div className="relative p-3 rounded-2xl shadow-glow animate-glow bg-white">
                <LayoutDashboard className="h-8 w-8 text-dental-primary" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-secondary rounded-full animate-pulse shadow-float"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">Advanced Dental Dashboard</h1>
              <p className="text-sm text-dental-muted-foreground">Comprehensive Practice Management</p>
            </div>
          </div>

          {/* Real-time Status Bar */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-dental-muted-foreground">Live Updates</span>
            </div>
            
            {/* Quick Settings */}
            <div className="flex items-center space-x-2 glass-card p-2 rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-8 w-8 p-0"
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              
              <div className="flex items-center space-x-1">
                <Bell className="h-4 w-4 text-dental-muted-foreground" />
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                  className="data-[state=checked]:bg-dental-primary"
                />
              </div>
            </div>

            {/* Security Indicator */}
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-600 font-medium">Secure</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Enhanced Navigation */}
          <div className="flex justify-center mb-8">
            <TabsList className="glass-card rounded-2xl p-3 grid grid-cols-6 gap-2 w-full max-w-4xl">
              <TabsTrigger 
                value="overview" 
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 ${
                  activeTab === 'overview' 
                    ? 'bg-gradient-primary text-white shadow-elegant scale-105' 
                    : 'text-dental-muted-foreground hover:text-dental-primary hover:bg-dental-primary/10 hover:scale-105'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="font-medium">Overview</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="patients"
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 ${
                  activeTab === 'patients' 
                    ? 'bg-gradient-primary text-white shadow-elegant scale-105' 
                    : 'text-dental-muted-foreground hover:text-dental-primary hover:bg-dental-primary/10 hover:scale-105'
                }`}
              >
                <Users className="h-4 w-4" />
                <span className="font-medium">Patients</span>
              </TabsTrigger>

              <TabsTrigger 
                value="communication"
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 ${
                  activeTab === 'communication' 
                    ? 'bg-gradient-primary text-white shadow-elegant scale-105' 
                    : 'text-dental-muted-foreground hover:text-dental-primary hover:bg-dental-primary/10 hover:scale-105'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span className="font-medium">Communication</span>
              </TabsTrigger>

              <TabsTrigger 
                value="tasks"
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 ${
                  activeTab === 'tasks' 
                    ? 'bg-gradient-primary text-white shadow-elegant scale-105' 
                    : 'text-dental-muted-foreground hover:text-dental-primary hover:bg-dental-primary/10 hover:scale-105'
                }`}
              >
                <CheckSquare className="h-4 w-4" />
                <span className="font-medium">Tasks</span>
              </TabsTrigger>

              <TabsTrigger 
                value="analytics"
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 ${
                  activeTab === 'analytics' 
                    ? 'bg-gradient-primary text-white shadow-elegant scale-105' 
                    : 'text-dental-muted-foreground hover:text-dental-primary hover:bg-dental-primary/10 hover:scale-105'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span className="font-medium">Analytics</span>
              </TabsTrigger>

              <TabsTrigger 
                value="settings"
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 ${
                  activeTab === 'settings' 
                    ? 'bg-gradient-primary text-white shadow-elegant scale-105' 
                    : 'text-dental-muted-foreground hover:text-dental-primary hover:bg-dental-primary/10 hover:scale-105'
                }`}
              >
                <Settings className="h-4 w-4" />
                <span className="font-medium">Settings</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="animate-fade-in">
            <TabsContent value="overview" className="space-y-6">
              <DashboardOverview dentistId={dentistId} />
            </TabsContent>

            <TabsContent value="patients" className="space-y-6">
              <PatientProfileQuickAccess dentistId={dentistId} />
            </TabsContent>

            <TabsContent value="communication" className="space-y-6">
              <CommunicationHub dentistId={dentistId} />
            </TabsContent>

            <TabsContent value="tasks" className="space-y-6">
              <TaskBoard dentistId={dentistId} />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <DentistAnalytics dentistId={dentistId} />
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dashboard Customization */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="h-5 w-5 text-dental-primary" />
                      Dashboard Customization
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Dark Mode</span>
                      <Switch
                        checked={darkMode}
                        onCheckedChange={toggleTheme}
                        className="data-[state=checked]:bg-dental-primary"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Real-time Updates</span>
                      <Switch
                        checked={realTimeUpdates}
                        onCheckedChange={setRealTimeUpdates}
                        className="data-[state=checked]:bg-dental-primary"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Desktop Notifications</span>
                      <Switch
                        checked={notificationsEnabled}
                        onCheckedChange={setNotificationsEnabled}
                        className="data-[state=checked]:bg-dental-primary"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Security & Audit */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-dental-primary" />
                      Security & Audit
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Two-Factor Authentication</span>
                      <Badge variant="secondary">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Session Timeout</span>
                      <span className="text-sm text-dental-muted-foreground">30 minutes</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Last Login</span>
                      <span className="text-sm text-dental-muted-foreground">Today, 9:15 AM</span>
                    </div>
                    <Button variant="outline" className="w-full">
                      View Audit Log
                    </Button>
                  </CardContent>
                </Card>

                {/* Performance Metrics */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-dental-primary" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Dashboard Load Time</span>
                      <Badge variant="outline">1.2s</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Data Sync Status</span>
                      <Badge className="bg-green-100 text-green-800">In Sync</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Memory Usage</span>
                      <span className="text-sm text-dental-muted-foreground">45% (Normal)</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-dental-primary" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      Export Patient Data
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Backup Dashboard Settings
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Generate Monthly Report
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Clear Cache
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
};