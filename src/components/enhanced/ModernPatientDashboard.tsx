import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Bell,
  User,
  CreditCard,
  FileText,
  Activity,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { formatClinicTime } from '@/lib/timezone';
import { emitAnalyticsEvent } from '@/lib/analyticsEvents';
import { logger } from '@/lib/logger';

interface DashboardData {
  profile: any;
  upcomingAppointments: any[];
  recentActivity: any[];
  healthMetrics: {
    lastVisit: Date | null;
    nextRecall: Date | null;
    totalAppointments: number;
    completedTreatments: number;
  };
  quickStats: {
    pendingAppointments: number;
    overdueBills: number;
    unreadMessages: number;
  };
}

export const ModernPatientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Fetch upcoming appointments with dentist information
      const { data: appointments } = await supabase
        .from('appointments')
        .select(`
          *,
          dentists!appointments_dentist_id_fkey(
            id,
            specialization,
            profiles!dentists_profile_id_fkey(first_name, last_name)
          )
        `)
        .eq('patient_id', user.id)
        .gte('appointment_date', new Date().toISOString())
        .order('appointment_date', { ascending: true })
        .limit(3);

      // Fetch health metrics
      const { data: allAppointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', user.id);

      const completedAppointments = allAppointments?.filter(apt => apt.status === 'completed') || [];
      const lastVisit = completedAppointments.length > 0 
        ? new Date(Math.max(...completedAppointments.map(apt => new Date(apt.appointment_date).getTime())))
        : null;

      setData({
        profile,
        upcomingAppointments: appointments || [],
        recentActivity: [],
        healthMetrics: {
          lastVisit,
          nextRecall: null,
          totalAppointments: allAppointments?.length || 0,
          completedTreatments: completedAppointments.length,
        },
        quickStats: {
          pendingAppointments: appointments?.filter(apt => apt.status === 'pending').length || 0,
          overdueBills: 0,
          unreadMessages: 0,
        }
      });

      await emitAnalyticsEvent('dashboard_viewed', user.id, { view: 'patient' });
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

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
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

  if (!data) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Unable to load dashboard</h3>
            <p className="text-muted-foreground text-center mb-4">
              There was an error loading your dashboard data.
            </p>
            <Button onClick={fetchDashboardData}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {data.profile?.first_name || 'Patient'}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your dental care.
          </p>
        </div>
        <Avatar className="h-12 w-12">
          <AvatarImage src={data.profile?.avatar_url} />
          <AvatarFallback>
            {data.profile?.first_name?.[0]}{data.profile?.last_name?.[0]}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Appointments</p>
                <p className="text-2xl font-bold">{data.quickStats.pendingAppointments}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Visits</p>
                <p className="text-2xl font-bold">{data.healthMetrics.totalAppointments}</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed Treatments</p>
                <p className="text-2xl font-bold">{data.healthMetrics.completedTreatments}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.upcomingAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No upcoming appointments</p>
                <Button className="mt-4" size="sm" onClick={() => navigate('/book-appointment')}>
                  Book Appointment
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {data.upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-start justify-between p-4 rounded-lg border bg-card"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {formatClinicTime(appointment.appointment_date, 'PPP')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Dr. {appointment.profiles?.first_name} {appointment.profiles?.last_name}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {appointment.reason || 'General consultation'}
                      </p>
                    </div>
                    <Badge 
                      variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}
                    >
                      {appointment.status}
                    </Badge>
                  </div>
                ))}
                <Button variant="outline" className="w-full" onClick={() => navigate('/patient/appointments')}>
                  View All Appointments
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Health Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Health Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Last Visit</span>
              <span className="font-medium">
                {data.healthMetrics.lastVisit 
                  ? formatClinicTime(data.healthMetrics.lastVisit, 'PPP')
                  : 'No visits yet'
                }
              </span>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Next Recall</span>
              <span className="font-medium">
                {data.healthMetrics.nextRecall 
                  ? formatClinicTime(data.healthMetrics.nextRecall, 'PPP')
                  : 'Not scheduled'
                }
              </span>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Treatment Progress</span>
              <span className="font-medium">
                {data.healthMetrics.completedTreatments} / {data.healthMetrics.totalAppointments} completed
              </span>
            </div>

            <Button variant="outline" className="w-full" onClick={() => navigate('/patient/documents')}>
              View Health Records
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => navigate('/book-appointment')}
            >
              <Calendar className="w-6 h-6" />
              <span className="text-xs">Book Appointment</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => navigate('/patient/documents')}
            >
              <FileText className="w-6 h-6" />
              <span className="text-xs">View Records</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => navigate('/patient/billing')}
            >
              <CreditCard className="w-6 h-6" />
              <span className="text-xs">Pay Bills</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => navigate('/messages')}
            >
              <Mail className="w-6 h-6" />
              <span className="text-xs">Messages</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};