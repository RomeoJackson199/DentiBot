import React, { useState, useEffect, useMemo } from "react";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  Clock,
  Pill,
  Heart,
  Activity,
  TrendingUp,
  MessageCircle,
  Plus,
  Bell,
  ChevronRight,
  MapPin,
  Phone,
  Video,
  FileText,
  CreditCard,
  Stethoscope,
  AlertTriangle,
  CheckCircle,
  User as UserIcon,
  Home,
  Settings,
  Sparkles,
  BookOpen,
  Target,
  Zap,
  ArrowRight
} from "lucide-react";

interface EnhancedPatientDashboardProps {
  user: User;
}

interface HealthMetrics {
  score: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
}

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  color: string;
  action: () => void;
}

interface UpcomingAppointment {
  id: string;
  date: string;
  time: string;
  dentistName: string;
  type: string;
  location: string;
  status: 'confirmed' | 'pending' | 'upcoming';
}

interface HealthStat {
  label: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  trend?: number;
}

export const EnhancedPatientDashboard: React.FC<EnhancedPatientDashboardProps> = ({ user }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<'home' | 'health' | 'appointments' | 'care' | 'profile'>('home');
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics>({
    score: 85,
    trend: 'up',
    lastUpdated: new Date().toISOString()
  });

  const upcomingAppointments: UpcomingAppointment[] = [
    {
      id: '1',
      date: '2024-01-15',
      time: '14:30',
      dentistName: 'Dr. Sarah Johnson',
      type: 'Regular Checkup',
      location: 'Main Clinic',
      status: 'confirmed'
    }
  ];

  const healthStats: HealthStat[] = [
    {
      label: 'Health Score',
      value: healthMetrics.score,
      icon: Heart,
      color: 'text-red-500',
      trend: 5
    },
    {
      label: 'Last Visit',
      value: '2 weeks ago',
      icon: Calendar,
      color: 'text-blue-500'
    },
    {
      label: 'Active Treatments',
      value: 2,
      icon: Stethoscope,
      color: 'text-green-500'
    },
    {
      label: 'Prescriptions',
      value: 1,
      icon: Pill,
      color: 'text-purple-500'
    }
  ];

  const quickActions: QuickAction[] = [
    {
      id: 'book',
      title: 'Book Appointment',
      subtitle: 'Schedule your next visit',
      icon: Calendar,
      color: 'bg-blue-500',
      action: () => setActiveSection('appointments')
    },
    {
      id: 'emergency',
      title: 'Emergency Care',
      subtitle: 'Urgent dental issues',
      icon: AlertTriangle,
      color: 'bg-red-500',
      action: () => toast({ title: "Emergency Care", description: "Connecting you to emergency services..." })
    },
    {
      id: 'chat',
      title: 'AI Assistant',
      subtitle: 'Get instant help',
      icon: MessageCircle,
      color: 'bg-emerald-500',
      action: () => toast({ title: "AI Assistant", description: "Opening AI chat..." })
    },
    {
      id: 'health',
      title: 'Health Insights',
      subtitle: 'View your progress',
      icon: TrendingUp,
      color: 'bg-purple-500',
      action: () => setActiveSection('health')
    }
  ];

  useEffect(() => {
    fetchUserData();
  }, [user.id]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setUserProfile(profile);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const HealthScoreCard = () => (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10" />
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Health Score</CardTitle>
            <p className="text-sm text-muted-foreground">Overall dental health</p>
          </div>
          <div className="flex items-center space-x-2">
            <Heart className="h-5 w-5 text-red-500" />
            <Badge variant="outline" className="bg-green-500/10 text-green-700">
              Excellent
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{healthMetrics.score}</span>
            </div>
            <div className="absolute -top-1 -right-1">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <TrendingUp className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>
          <div className="flex-1">
            <Progress value={healthMetrics.score} className="mb-2" />
            <p className="text-sm text-muted-foreground">
              {healthMetrics.score >= 80 ? 'Excellent health' : 
               healthMetrics.score >= 60 ? 'Good health' : 'Needs attention'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const QuickActionsGrid = () => (
    <div className="grid grid-cols-2 gap-3">
      {quickActions.map((action, index) => (
        <motion.div
          key={action.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
            onClick={action.action}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className={cn("p-2 rounded-lg", action.color)}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{action.title}</h3>
                  <p className="text-xs text-muted-foreground truncate">{action.subtitle}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );

  const AppointmentCard = ({ appointment }: { appointment: UpcomingAppointment }) => (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h4 className="font-medium text-sm">{appointment.type}</h4>
              <p className="text-sm text-muted-foreground">{appointment.dentistName}</p>
              <div className="flex items-center space-x-2 mt-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <Badge 
              variant={appointment.status === 'confirmed' ? 'default' : 'outline'}
              className="text-xs"
            >
              {appointment.status}
            </Badge>
            <Button size="sm" variant="outline">
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const HealthStatsGrid = () => (
    <div className="grid grid-cols-2 gap-3">
      {healthStats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <stat.icon className={cn("h-6 w-6", stat.color)} />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                {stat.trend && (
                  <div className="flex items-center justify-center space-x-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-500">+{stat.trend}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );

  const BottomNavigation = () => {
    const navItems = [
      { id: 'home', icon: Home, label: 'Home' },
      { id: 'health', icon: Activity, label: 'Health' },
      { id: 'appointments', icon: Calendar, label: 'Appointments' },
      { id: 'care', icon: Stethoscope, label: 'Care' },
      { id: 'profile', icon: UserIcon, label: 'Profile' }
    ] as const;

    return (
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border z-50">
        <div className="flex items-center justify-around py-2 safe-area-pb">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => setActiveSection(item.id)}
              className={cn(
                "flex flex-col items-center space-y-1 h-16 px-3",
                activeSection === item.id ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5",
                activeSection === item.id && "scale-110"
              )} />
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          ))}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'home':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Welcome back!</h1>
                <p className="text-muted-foreground">
                  {userProfile?.first_name ? `Hi ${userProfile.first_name}` : 'Good to see you'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button size="icon" variant="outline">
                  <Bell className="h-4 w-4" />
                </Button>
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    <UserIcon className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Health Score */}
            <HealthScoreCard />

            {/* Quick Actions */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
              <QuickActionsGrid />
            </div>

            {/* Upcoming Appointments */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Upcoming Appointments</h2>
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map(appointment => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-3">No upcoming appointments</p>
                    <Button>Schedule Appointment</Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Health Stats */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Health Overview</h2>
              <HealthStatsGrid />
            </div>
          </div>
        );

      case 'health':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Health Insights</h1>
              <Button variant="outline" size="sm">
                <Sparkles className="h-4 w-4 mr-2" />
                AI Analysis
              </Button>
            </div>
            <HealthScoreCard />
            <HealthStatsGrid />
          </div>
        );

      case 'appointments':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Appointments</h1>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Book New
              </Button>
            </div>
            {upcomingAppointments.map(appointment => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <div className="w-64 border-r border-border bg-card">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-semibold">Patient Portal</h2>
                <p className="text-sm text-muted-foreground">Dental Care</p>
              </div>
            </div>
            
            <nav className="space-y-2">
              {[
                { id: 'home', icon: Home, label: 'Dashboard' },
                { id: 'health', icon: Activity, label: 'Health Insights' },
                { id: 'appointments', icon: Calendar, label: 'Appointments' },
                { id: 'care', icon: Stethoscope, label: 'Care Plans' },
                { id: 'profile', icon: Settings, label: 'Settings' }
              ].map((item) => (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveSection(item.id as any)}
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Button>
              ))}
            </nav>
          </div>
        </div>
        
        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="pb-20">
          <div className="p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <BottomNavigation />
      </div>
    </div>
  );
};