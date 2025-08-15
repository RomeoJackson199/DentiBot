import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Heart,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Clock,
  Zap,
  Shield,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Sparkles,
  Eye,
  Smile,
  Tooth,
  Users,
  Info,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Minus,
  Plus
} from "lucide-react";

interface HealthMetric {
  id: string;
  label: string;
  value: number;
  maxValue: number;
  unit?: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  color: string;
  icon: React.ComponentType<any>;
  description: string;
  lastUpdated: string;
}

interface HealthGoal {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  unit: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  icon: React.ComponentType<any>;
}

interface EnhancedHealthOverviewProps {
  patientId?: string;
  onViewDetails?: (metricId: string) => void;
  onSetGoal?: () => void;
}

export const EnhancedHealthOverview: React.FC<EnhancedHealthOverviewProps> = ({
  patientId,
  onViewDetails,
  onSetGoal
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'goals' | 'history'>('overview');
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // Sample health metrics
  const healthMetrics: HealthMetric[] = [
    {
      id: 'overall',
      label: 'Overall Health',
      value: 85,
      maxValue: 100,
      unit: '/100',
      trend: 'up',
      trendValue: 5,
      color: 'text-green-500',
      icon: Heart,
      description: 'Comprehensive dental health assessment based on all metrics',
      lastUpdated: '2024-01-10'
    },
    {
      id: 'hygiene',
      label: 'Oral Hygiene',
      value: 92,
      maxValue: 100,
      unit: '/100',
      trend: 'up',
      trendValue: 3,
      color: 'text-blue-500',
      icon: Sparkles,
      description: 'Daily dental hygiene routine effectiveness',
      lastUpdated: '2024-01-10'
    },
    {
      id: 'gum_health',
      label: 'Gum Health',
      value: 78,
      maxValue: 100,
      unit: '/100',
      trend: 'stable',
      trendValue: 0,
      color: 'text-orange-500',
      icon: Shield,
      description: 'Gingival health and inflammation levels',
      lastUpdated: '2024-01-08'
    },
    {
      id: 'cavity_risk',
      label: 'Cavity Risk',
      value: 15,
      maxValue: 100,
      unit: '%',
      trend: 'down',
      trendValue: -8,
      color: 'text-red-500',
      icon: Tooth,
      description: 'Risk assessment for dental caries development',
      lastUpdated: '2024-01-10'
    }
  ];

  // Sample health goals
  const healthGoals: HealthGoal[] = [
    {
      id: 'brushing',
      title: 'Daily Brushing',
      description: 'Brush teeth twice daily',
      progress: 13,
      target: 14,
      unit: 'days',
      dueDate: '2024-01-21',
      priority: 'high',
      icon: Sparkles
    },
    {
      id: 'flossing',
      title: 'Regular Flossing',
      description: 'Floss at least 5 times per week',
      progress: 4,
      target: 5,
      unit: 'times',
      dueDate: '2024-01-21',
      priority: 'medium',
      icon: Target
    },
    {
      id: 'checkup',
      title: 'Dental Checkup',
      description: 'Schedule next routine checkup',
      progress: 0,
      target: 1,
      unit: 'visit',
      dueDate: '2024-02-15',
      priority: 'medium',
      icon: Calendar
    }
  ];

  const overallHealthScore = healthMetrics.find(m => m.id === 'overall')?.value || 0;

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHealthScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Attention';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <ArrowDown className="h-3 w-3 text-red-500" />;
      default:
        return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  const MetricCard = ({ metric }: { metric: HealthMetric }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className={cn(
          "cursor-pointer transition-all duration-200 hover:shadow-lg",
          selectedMetric === metric.id && "ring-2 ring-primary"
        )}
        onClick={() => setSelectedMetric(selectedMetric === metric.id ? null : metric.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className={cn("p-2 rounded-lg bg-current/10", metric.color)}>
                <metric.icon className={cn("h-4 w-4", metric.color)} />
              </div>
              <div>
                <h3 className="font-medium text-sm">{metric.label}</h3>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(metric.trend)}
                  <span className="text-xs text-muted-foreground">
                    {metric.trend === 'up' ? '+' : metric.trend === 'down' ? '-' : ''}
                    {Math.abs(metric.trendValue)}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={cn("text-lg font-bold", metric.color)}>
                {metric.value}{metric.unit}
              </div>
            </div>
          </div>
          
          <Progress 
            value={(metric.value / metric.maxValue) * 100} 
            className="mb-2 h-2"
          />
          
          <AnimatePresence>
            {selectedMetric === metric.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t pt-3 mt-3"
              >
                <p className="text-xs text-muted-foreground mb-2">
                  {metric.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Updated: {new Date(metric.lastUpdated).toLocaleDateString()}
                  </span>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails?.(metric.id);
                    }}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Details
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );

  const GoalCard = ({ goal }: { goal: HealthGoal }) => {
    const progressPercentage = (goal.progress / goal.target) * 100;
    const isCompleted = goal.progress >= goal.target;
    const isOverdue = new Date(goal.dueDate) < new Date() && !isCompleted;

    return (
      <Card className={cn(
        "transition-all duration-200 hover:shadow-md",
        isCompleted && "border-green-500/50 bg-green-50/50 dark:bg-green-900/10",
        isOverdue && "border-red-500/50 bg-red-50/50 dark:bg-red-900/10"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start space-x-3">
              <div className={cn(
                "p-2 rounded-lg",
                isCompleted ? "bg-green-500/10" : "bg-primary/10"
              )}>
                {isCompleted ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <goal.icon className="h-4 w-4 text-primary" />
                )}
              </div>
              <div>
                <h3 className="font-medium text-sm">{goal.title}</h3>
                <p className="text-xs text-muted-foreground">{goal.description}</p>
              </div>
            </div>
            <Badge variant={isCompleted ? 'default' : isOverdue ? 'destructive' : 'secondary'}>
              {isCompleted ? 'Complete' : isOverdue ? 'Overdue' : goal.priority}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {goal.progress}/{goal.target} {goal.unit}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{Math.round(progressPercentage)}% complete</span>
              <span>Due: {new Date(goal.dueDate).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Main Health Score */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10" />
        <CardContent className="p-6 relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Health Score</h2>
              <p className="text-muted-foreground">Overall dental health assessment</p>
            </div>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Report
            </Button>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-foreground">{overallHealthScore}</span>
              </div>
              <div className="absolute -bottom-1 -right-1">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            
            <div className="flex-1">
              <div className={cn("text-lg font-semibold mb-1", getHealthScoreColor(overallHealthScore))}>
                {getHealthScoreLabel(overallHealthScore)}
              </div>
              <Progress value={overallHealthScore} className="mb-2 h-3" />
              <p className="text-sm text-muted-foreground">
                You're doing great! Keep up the good oral hygiene routine.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        {healthMetrics.slice(1, 3).map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      {/* Active Goals */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Active Goals</h3>
          <Button variant="ghost" size="sm" onClick={onSetGoal}>
            <Plus className="h-4 w-4 mr-1" />
            Add Goal
          </Button>
        </div>
        <div className="space-y-3">
          {healthGoals.slice(0, 2).map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { text: "Completed teeth cleaning", time: "2 hours ago", icon: Sparkles, color: "text-blue-500" },
              { text: "Health score improved by 5 points", time: "1 day ago", icon: TrendingUp, color: "text-green-500" },
              { text: "Flossing goal achieved", time: "3 days ago", icon: Target, color: "text-purple-500" }
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className={cn("p-1.5 rounded-full bg-current/10", activity.color)}>
                  <activity.icon className={cn("h-3 w-3", activity.color)} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.text}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const MetricsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Health Metrics</h3>
        <Button variant="outline" size="sm">
          <Activity className="h-4 w-4 mr-2" />
          Sync Data
        </Button>
      </div>
      {healthMetrics.map((metric) => (
        <MetricCard key={metric.id} metric={metric} />
      ))}
    </div>
  );

  const GoalsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Health Goals</h3>
        <Button onClick={onSetGoal}>
          <Plus className="h-4 w-4 mr-2" />
          New Goal
        </Button>
      </div>
      {healthGoals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} />
      ))}
    </div>
  );

  const HistoryTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Health History</h3>
      <Card>
        <CardContent className="p-6 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Health history charts coming soon</p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Health Insights</h1>
          <p className="text-muted-foreground">Track your dental health progress</p>
        </div>
        <Button variant="outline" size="sm">
          <Sparkles className="h-4 w-4 mr-2" />
          AI Analysis
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="metrics" className="mt-6">
          <MetricsTab />
        </TabsContent>

        <TabsContent value="goals" className="mt-6">
          <GoalsTab />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <HistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};