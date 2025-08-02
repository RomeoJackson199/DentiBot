import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, Clock, AlertTriangle, Users, TrendingUp, 
  MessageSquare, CheckCircle, Timer, DollarSign,
  Phone, Mail, Video, MoreHorizontal
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface DashboardOverviewProps {
  dentistId: string;
}

interface OverviewData {
  today_appointments_count: number;
  urgent_cases_count: number;
  patients_waiting_count: number;
  patients_in_treatment_count: number;
  revenue_today: number;
  pending_tasks_count: number;
  unread_messages_count: number;
}

interface TodayAppointment {
  id: string;
  patient_name: string;
  appointment_date: string;
  urgency: string;
  patient_status: string;
  reason: string;
  patient_id: string;
}

export const DashboardOverview = ({ dentistId }: DashboardOverviewProps) => {
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchOverviewData();
    fetchTodayAppointments();
  }, [dentistId]);

  const fetchOverviewData = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_dashboard_overview', { p_dentist_id: dentistId });

      if (error) throw error;
      setOverviewData(data[0]);
    } catch (error: any) {
      console.error('Error fetching overview:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard overview",
        variant: "destructive",
      });
    }
  };

  const fetchTodayAppointments = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('appointments')
        .select('id, patient_name, appointment_date, urgency, patient_status, reason, patient_id')
        .eq('dentist_id', dentistId)
        .gte('appointment_date', `${today}T00:00:00`)
        .lt('appointment_date', `${today}T23:59:59`)
        .neq('status', 'cancelled')
        .order('appointment_date');

      if (error) throw error;
      setTodayAppointments(data || []);
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePatientStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const statusField = newStatus === 'checked_in' ? 'checked_in_at' :
                         newStatus === 'in_treatment' ? 'treatment_started_at' :
                         newStatus === 'completed' ? 'treatment_completed_at' : null;

      const updateData: any = { patient_status: newStatus };
      if (statusField) {
        updateData[statusField] = new Date().toISOString();
      }

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Patient status updated to ${newStatus.replace('_', ' ')}`,
      });

      fetchTodayAppointments();
      fetchOverviewData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update patient status",
        variant: "destructive",
      });
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checked_in': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_treatment': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const sendQuickReminder = async (patientId: string, appointmentId: string) => {
    try {
      await supabase
        .from('communications')
        .insert({
          dentist_id: dentistId,
          patient_id: patientId,
          communication_type: 'sms',
          subject: 'Appointment Reminder',
          message: 'This is a reminder of your upcoming dental appointment.',
          status: 'sent'
        });

      toast({
        title: "Reminder Sent",
        description: "SMS reminder sent to patient",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send reminder",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="glass-card animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Real-time KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-dental-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold gradient-text">
              {overviewData?.today_appointments_count || 0}
            </div>
            <p className="text-xs text-dental-muted-foreground">
              Scheduled for today
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Cases</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {overviewData?.urgent_cases_count || 0}
            </div>
            <p className="text-xs text-dental-muted-foreground">
              Need immediate attention
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waiting Room</CardTitle>
            <Timer className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {overviewData?.patients_waiting_count || 0}
            </div>
            <p className="text-xs text-dental-muted-foreground">
              Patients waiting
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Treatment</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {overviewData?.patients_in_treatment_count || 0}
            </div>
            <p className="text-xs text-dental-muted-foreground">
              Currently being treated
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${overviewData?.revenue_today || 0}
            </div>
            <p className="text-xs text-dental-muted-foreground">
              Revenue generated today
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {overviewData?.pending_tasks_count || 0}
            </div>
            <p className="text-xs text-dental-muted-foreground">
              Tasks to complete
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {overviewData?.unread_messages_count || 0}
            </div>
            <p className="text-xs text-dental-muted-foreground">
              Messages awaiting reply
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold gradient-text">94%</div>
            <p className="text-xs text-dental-muted-foreground">
              Above average performance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule with Patient Queue */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-dental-primary" />
            Today's Schedule & Patient Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayAppointments.length === 0 ? (
            <p className="text-center text-dental-muted-foreground py-8">
              No appointments scheduled for today
            </p>
          ) : (
            <div className="space-y-4">
              {todayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-border/50 hover:bg-background/70 transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-3 h-3 rounded-full bg-dental-primary"></div>
                    </div>
                    <div>
                      <h4 className="font-semibold">{appointment.patient_name}</h4>
                      <p className="text-sm text-dental-muted-foreground">
                        {new Date(appointment.appointment_date).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })} - {appointment.reason}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Badge variant={getUrgencyColor(appointment.urgency)}>
                      {appointment.urgency}
                    </Badge>
                    
                    <Badge className={getStatusColor(appointment.patient_status)}>
                      {appointment.patient_status.replace('_', ' ')}
                    </Badge>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {appointment.patient_status === 'scheduled' && (
                          <DropdownMenuItem
                            onClick={() => updatePatientStatus(appointment.id, 'checked_in')}
                          >
                            Check In Patient
                          </DropdownMenuItem>
                        )}
                        {appointment.patient_status === 'checked_in' && (
                          <DropdownMenuItem
                            onClick={() => updatePatientStatus(appointment.id, 'in_treatment')}
                          >
                            Start Treatment
                          </DropdownMenuItem>
                        )}
                        {appointment.patient_status === 'in_treatment' && (
                          <DropdownMenuItem
                            onClick={() => updatePatientStatus(appointment.id, 'completed')}
                          >
                            Complete Treatment
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => sendQuickReminder(appointment.patient_id, appointment.id)}
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Send Reminder
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Video className="h-4 w-4 mr-2" />
                          Start Video Call
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};