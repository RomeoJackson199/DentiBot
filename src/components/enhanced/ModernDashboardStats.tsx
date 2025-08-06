import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Users, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Activity
} from "lucide-react";

interface DashboardStat {
  id: string;
  title: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  description?: string;
}

interface ModernDashboardStatsProps {
  stats: {
    todayAppointments: number;
    urgentCases: number;
    patientsWaiting: number;
    patientsInTreatment: number;
    revenueToday: number;
    pendingTasks: number;
    unreadMessages: number;
  };
}

export function ModernDashboardStats({ stats }: ModernDashboardStatsProps) {
  const dashboardStats: DashboardStat[] = [
    {
      id: "appointments",
      title: "Today's Appointments",
      value: stats.todayAppointments,
      icon: Calendar,
      color: "text-dental-primary",
      bgColor: "bg-dental-primary/10",
      description: "Scheduled for today"
    },
    {
      id: "urgent",
      title: "Urgent Cases",
      value: stats.urgentCases,
      icon: AlertTriangle,
      color: "text-dental-error",
      bgColor: "bg-dental-error/10",
      description: "Require immediate attention"
    },
    {
      id: "waiting",
      title: "Patients Waiting",
      value: stats.patientsWaiting,
      icon: Clock,
      color: "text-dental-warning",
      bgColor: "bg-dental-warning/10",
      description: "Currently in waiting room"
    },
    {
      id: "treatment",
      title: "In Treatment",
      value: stats.patientsInTreatment,
      icon: Activity,
      color: "text-dental-info",
      bgColor: "bg-dental-info/10",
      description: "Currently receiving care"
    },
    {
      id: "revenue",
      title: "Today's Revenue",
      value: `€${stats.revenueToday.toLocaleString()}`,
      icon: DollarSign,
      color: "text-dental-success",
      bgColor: "bg-dental-success/10",
      description: "Revenue generated today"
    },
    {
      id: "tasks",
      title: "Pending Tasks",
      value: stats.pendingTasks,
      icon: CheckCircle,
      color: "text-dental-secondary",
      bgColor: "bg-dental-secondary/10",
      description: "Tasks requiring completion"
    }
  ];

  const getUrgencyBadge = (statId: string, value: number) => {
    switch (statId) {
      case "urgent":
        if (value === 0) return { text: "All Clear", variant: "default" as const };
        if (value <= 2) return { text: "Manageable", variant: "secondary" as const };
        return { text: "High Priority", variant: "destructive" as const };
      case "waiting":
        if (value === 0) return { text: "No Wait", variant: "default" as const };
        if (value <= 3) return { text: "Normal", variant: "secondary" as const };
        return { text: "Busy", variant: "warning" as const };
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {dashboardStats.map((stat) => {
        const Icon = stat.icon;
        const badge = getUrgencyBadge(stat.id, Number(stat.value));

        return (
          <Card 
            key={stat.id} 
            className="relative overflow-hidden transition-all duration-300 hover:shadow-elegant hover:scale-105 group border-l-4 border-l-transparent hover:border-l-dental-primary"
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${stat.bgColor} group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                {badge && (
                  <Badge variant={badge.variant} className="text-xs">
                    {badge.text}
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-dental-foreground group-hover:text-dental-primary transition-colors">
                  {stat.value}
                </p>
                <p className="text-sm font-medium text-dental-muted-foreground">
                  {stat.title}
                </p>
              </div>
              
              {stat.description && (
                <p className="text-xs text-dental-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  {stat.description}
                </p>
              )}
            </CardContent>

            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </Card>
        );
      })}
    </div>
  );
}