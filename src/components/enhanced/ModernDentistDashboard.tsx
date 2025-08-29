import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar, 
  Clock, 
  Users, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Activity,
  DollarSign,
  User,
  Phone,
  Mail,
  MapPin,
  Filter,
  Search,
  MoreHorizontal,
  CalendarDays,
  Stethoscope
} from 'lucide-react';
import { formatClinicTime } from '@/lib/timezone';
import { emitAnalyticsEvent } from '@/lib/analyticsEvents';
import { AppointmentManager } from '@/components/appointments/AppointmentManager';

interface DashboardStats {
  todayAppointments: number;
  weeklyAppointments: number;
  monthlyRevenue: number;
  patientSatisfaction: number;
  upcomingEmergencies: number;
  completionRate: number;
}

interface RecentActivity {
  id: string;
  type: 'appointment_booked' | 'appointment_completed' | 'patient_registered' | 'payment_received';
  description: string;
  timestamp: string;
  patient_name?: string;
}

export const ModernDentistDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDentist, setCurrentDentist] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch dentist profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setCurrentDentist(profile);

      // Fetch appointments for stats
      const today = new Date();
      const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const { data: todayAppointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('dentist_id', user.id)
        .gte('appointment_date', today.toISOString().split('T')[0])
        .lt('appointment_date', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      const { data: weeklyAppointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('dentist_id', user.id)
        .gte('appointment_date', startOfWeek.toISOString());

      const { data: monthlyAppointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('dentist_id', user.id)
        .gte('appointment_date', startOfMonth.toISOString());

      const { data: emergencyAppointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('dentist_id', user.id)
        .eq('urgency', 'emergency')
        .gte('appointment_date', today.toISOString())
        .eq('status', 'pending');

      const completedToday = todayAppointments?.filter(apt => apt.status === 'completed').length || 0;
      const totalToday = todayAppointments?.length || 0;

      setStats({
        todayAppointments: totalToday,
        weeklyAppointments: weeklyAppointments?.length || 0,
        monthlyRevenue: 0, // TODO: Implement revenue tracking
        patientSatisfaction: 4.8, // TODO: Implement satisfaction tracking
        upcomingEmergencies: emergencyAppointments?.length || 0,
        completionRate: totalToday > 0 ? (completedToday / totalToday) * 100 : 0,
      });

      // Mock recent activity - TODO: Implement real activity tracking
      setRecentActivity([
        {
          id: '1',
          type: 'appointment_booked',
          description: 'New appointment booked for tomorrow',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          patient_name: 'Sarah Johnson',
        },
        {
          id: '2',
          type: 'appointment_completed',
          description: 'Completed routine checkup',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          patient_name: 'Michael Chen',
        },
        {
          id: '3',
          type: 'patient_registered',
          description: 'New patient registered',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          patient_name: 'Emma Rodriguez',
        },
      ]);

      await emitAnalyticsEvent('dentist_dashboard_viewed', user.id, {
        appointments_today: totalToday,
        emergencies_pending: emergencyAppointments?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'appointment_booked':
        return Calendar;
      case 'appointment_completed':
        return CheckCircle;
      case 'patient_registered':
        return User;
      case 'payment_received':
        return DollarSign;
      default:
        return Activity;
    }
  };

  const getActivityColor = (type: RecentActivity['type']) => {
    switch (type) {
      case 'appointment_booked':
        return 'text-blue-600';
      case 'appointment_completed':
        return 'text-green-600';
      case 'patient_registered':
        return 'text-purple-600';
      case 'payment_received':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, 
            Dr. {currentDentist?.last_name || 'Doctor'}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening in your practice today.
          </p>
        </div>
        <Avatar className="h-12 w-12">
          <AvatarImage src={currentDentist?.avatar_url} />
          <AvatarFallback>
            {currentDentist?.first_name?.[0]}{currentDentist?.last_name?.[0]}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Appointments</p>
                <p className="text-2xl font-bold">{stats?.todayAppointments || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">{stats?.weeklyAppointments || 0}</p>
              </div>
              <CalendarDays className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Emergencies</p>
                <p className="text-2xl font-bold text-red-600">{stats?.upcomingEmergencies || 0}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{Math.round(stats?.completionRate || 0)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Appointments */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Appointment Management</CardTitle>
            </CardHeader>
            <CardContent>
              <AppointmentManager dentistId={currentDentist?.id} user={currentDentist} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="text-center py-6">
                  <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => {
                    const Icon = getActivityIcon(activity.type);
                    const colorClass = getActivityColor(activity.type);

                    return (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className={`p-2 rounded-full bg-accent ${colorClass}`}>
                          <Icon className="w-3 h-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{activity.description}</p>
                          {activity.patient_name && (
                            <p className="text-xs text-muted-foreground">
                              Patient: {activity.patient_name}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatClinicTime(activity.timestamp, 'PPp')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                <Button variant="outline" className="justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  New Appointment
                </Button>
                <Button variant="outline" className="justify-start">
                  <User className="w-4 h-4 mr-2" />
                  Add Patient
                </Button>
                <Button variant="outline" className="justify-start">
                  <Stethoscope className="w-4 h-4 mr-2" />
                  Treatment Plans
                </Button>
                <Button variant="outline" className="justify-start">
                  <Activity className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Practice Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Practice Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Patient Satisfaction</span>
                <div className="flex items-center gap-1">
                  <span className="font-medium">{stats?.patientSatisfaction || 0}</span>
                  <span className="text-xs text-muted-foreground">/5.0</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Monthly Revenue</span>
                <span className="font-medium">€{stats?.monthlyRevenue?.toLocaleString() || '0'}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Patients</span>
                <span className="font-medium">248</span>
              </div>

              <Button variant="outline" className="w-full">
                View Full Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};