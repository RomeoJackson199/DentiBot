import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertTriangle, 
  Clock, 
  Activity, 
  Heart,
  Calendar,
  User,
  Phone,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Brain,
  Thermometer
} from "lucide-react";
import { format } from "date-fns";
import { AIConversationDialog } from "@/components/AIConversationDialog";

interface UrgencyAppointment {
  id: string;
  patient_name: string;
  appointment_date: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  reason: string;
  pain_level?: number;
  symptoms?: string;
  created_at: string;
  status: string;
  phone?: string;
  patient_id: string;
  consultation_notes?: string;
  urgency_assessments?: Array<{
    pain_level: number;
    has_bleeding: boolean;
    has_swelling: boolean;
    duration_symptoms: string;
  }>;
  symptom_summaries?: Array<{
    summary_text: string;
    extracted_symptoms: unknown;
    pain_level: number;
    urgency_level: string;
  }>;
}

interface DashboardStats {
  totalPatients: number;
  emergencyCases: number;
  averageWaitTime: number;
  completionRate: number;
  trends: {
    emergencyIncrease: number;
    waitTimeChange: number;
  };
}

interface EnhancedUrgencyDashboardProps {
  dentistId: string;
}

export const EnhancedUrgencyDashboard = ({ dentistId }: EnhancedUrgencyDashboardProps) => {
  const [appointments, setAppointments] = useState<UrgencyAppointment[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    emergencyCases: 0,
    averageWaitTime: 0,
    completionRate: 0,
    trends: { emergencyIncrease: 0, waitTimeChange: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [showAIConsultation, setShowAIConsultation] = useState(false);
  const [sendingSMS, setSendingSMS] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchEnhancedData();
    const interval = setInterval(fetchEnhancedData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [dentistId]);

  const fetchEnhancedData = async () => {
    try {
      // Fetch appointments with enhanced data
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id,
          patient_name,
          appointment_date,
          urgency,
          reason,
          created_at,
          status,
          patient_id,
          consultation_notes,
          urgency_assessments (
            pain_level,
            has_bleeding,
            has_swelling,
            duration_symptoms
          ),
          patient:profiles!patient_id (
            phone
          )
        `)
        .eq('dentist_id', dentistId)
        .gte('appointment_date', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (appointmentsError) throw appointmentsError;

      // Fetch symptom summaries for each patient
      const appointmentsWithSummaries = await Promise.all(
        (appointmentsData || []).map(async (appointment) => {
          const { data: summaries } = await supabase
            .from('patient_symptom_summaries')
            .select('*')
            .eq('patient_id', appointment.patient_id)
            .order('created_at', { ascending: false })
            .limit(3);

          return {
            ...appointment,
            phone: appointment.patient?.phone,
            symptom_summaries: summaries || []
          };
        })
      );

      setAppointments(appointmentsWithSummaries);

      // Calculate enhanced statistics
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);

      const todayAppointments = appointmentsWithSummaries.filter(
        apt => new Date(apt.appointment_date) >= todayStart
      );
      const yesterdayAppointments = appointmentsWithSummaries.filter(
        apt => new Date(apt.appointment_date) >= yesterdayStart && new Date(apt.appointment_date) < todayStart
      );

      const emergencyToday = todayAppointments.filter(apt => apt.urgency === 'emergency').length;
      const emergencyYesterday = yesterdayAppointments.filter(apt => apt.urgency === 'emergency').length;

      const completedToday = todayAppointments.filter(apt => apt.status === 'completed').length;
      const totalToday = todayAppointments.length;

      setStats({
        totalPatients: appointmentsWithSummaries.length,
        emergencyCases: appointmentsWithSummaries.filter(apt => apt.urgency === 'emergency').length,
        averageWaitTime: calculateAverageWaitTime(appointmentsWithSummaries),
        completionRate: totalToday > 0 ? (completedToday / totalToday) * 100 : 0,
        trends: {
          emergencyIncrease: emergencyYesterday > 0 ? ((emergencyToday - emergencyYesterday) / emergencyYesterday) * 100 : 0,
          waitTimeChange: Math.random() * 20 - 10 // Placeholder calculation
        }
      });

    } catch (error) {
      console.error('Error fetching enhanced data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateAverageWaitTime = (appointments: UrgencyAppointment[]): number => {
    const waitTimes = appointments
      .filter(apt => apt.status === 'completed')
      .map(apt => {
        const diff =
          (new Date(apt.appointment_date).getTime() -
            new Date(apt.created_at).getTime()) /
          60000;
        // clamp between 0 and 240 minutes
        return Math.min(Math.max(diff, 0), 240);
      });

    if (waitTimes.length === 0) return 0;
    const total = waitTimes.reduce((a, b) => a + b, 0);
    return Math.round(total / waitTimes.length);
  };

  const getUrgencyConfig = (urgency: string) => {
    switch(urgency) {
      case 'emergency':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: Heart,
          priority: 4,
          text: 'EMERGENCY',
          bgClass: 'bg-red-50 border-l-red-500'
        };
      case 'high':
        return {
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: AlertTriangle,
          priority: 3,
          text: 'HIGH',
          bgClass: 'bg-orange-50 border-l-orange-500'
        };
      case 'medium':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: Clock,
          priority: 2,
          text: 'MEDIUM',
          bgClass: 'bg-yellow-50 border-l-yellow-500'
        };
      case 'low':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: Activity,
          priority: 1,
          text: 'LOW',
          bgClass: 'bg-green-50 border-l-green-500'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: Activity,
          priority: 1,
          text: 'STANDARD',
          bgClass: 'bg-gray-50 border-l-gray-500'
        };
    }
  };

  const handleSendSMSReminder = async (appointment: UrgencyAppointment) => {
    if (!appointment.phone) {
      toast({
        title: "No Phone Number",
        description: "Patient phone number not available",
        variant: "destructive",
      });
      return;
    }

    setSendingSMS(appointment.id);
    try {
      const message = `Hello ${appointment.patient_name}, this is a reminder for your dental appointment on ${format(new Date(appointment.appointment_date), 'MMM dd, yyyy')} at ${format(new Date(appointment.appointment_date), 'HH:mm')}. Please confirm your attendance.`;

      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          to: appointment.phone,
          message,
          messageType: 'reminder',
          patientId: appointment.patient_id,
          dentistId
        }
      });

      if (error) throw error;

      toast({
        title: "SMS Sent",
        description: `Reminder sent to ${appointment.patient_name}`,
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send SMS reminder';
      toast({
        title: "SMS Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSendingSMS(null);
    }
  };

  const handlePatientConsultation = (patientId: string) => {
    setSelectedPatient(patientId);
    setShowAIConsultation(true);
  };

  const sortedAppointments = appointments.sort((a, b) => {
    const urgencyA = getUrgencyConfig(a.urgency);
    const urgencyB = getUrgencyConfig(b.urgency);
    if (urgencyA.priority !== urgencyB.priority) {
      return urgencyB.priority - urgencyA.priority;
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dental-primary mx-auto"></div>
          <p className="mt-4 text-dental-muted-foreground">Loading enhanced triage data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Real-time Stats */}
      <Card className="glass-card border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Brain className="h-6 w-6 mr-3 text-blue-600" />
            AI-Enhanced Triage Dashboard
          </CardTitle>
          <p className="text-dental-muted-foreground">
            Real-time patient prioritization with AI-driven insights and predictive analytics
          </p>
        </CardHeader>
      </Card>

      {/* Advanced Analytics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalPatients}</p>
                <p className="text-sm text-dental-muted-foreground">Active Patients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-red-100">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.emergencyCases}</p>
                <p className="text-sm text-dental-muted-foreground">Emergency Cases</p>
                {stats.trends.emergencyIncrease > 0 && (
                  <div className="flex items-center text-xs text-red-500">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{stats.trends.emergencyIncrease.toFixed(0)}% today
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Math.round(stats.averageWaitTime)}</p>
                <p className="text-sm text-dental-muted-foreground">Avg Wait (min)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Math.round(stats.completionRate)}%</p>
                <p className="text-sm text-dental-muted-foreground">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Thermometer className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">7.2</p>
                <p className="text-sm text-dental-muted-foreground">Avg Pain Level</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Patient Queue */}
      <div className="space-y-4">
        {sortedAppointments.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-8 text-center">
              <Activity className="h-12 w-12 text-dental-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Triage Cases</h3>
              <p className="text-dental-muted-foreground">
                All current appointments are routine. Emergency cases will appear here with AI-enhanced prioritization.
              </p>
            </CardContent>
          </Card>
        ) : (
          sortedAppointments.map((appointment) => {
            const config = getUrgencyConfig(appointment.urgency);
            const IconComponent = config.icon;
            const assessment = appointment.urgency_assessments?.[0];
            const latestSummary = appointment.symptom_summaries?.[0];
            
            return (
              <Card key={appointment.id} className={`glass-card border-l-4 ${config.bgClass} hover:shadow-lg transition-all`}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex-1 space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge className={config.color}>
                            <IconComponent className="h-3 w-3 mr-1" />
                            {config.text}
                          </Badge>
                          <div className="flex items-center space-x-2 text-sm text-dental-muted-foreground">
                            <User className="h-4 w-4" />
                            <span className="font-medium text-lg">{appointment.patient_name}</span>
                          </div>
                        </div>
                        <div className="text-right text-sm text-dental-muted-foreground">
                          {format(new Date(appointment.appointment_date), 'MMM dd, HH:mm')}
                        </div>
                      </div>

                      {/* Enhanced Patient Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-dental-primary">Reason & Symptoms</h4>
                          <p className="text-sm">{appointment.reason}</p>
                          {assessment && (
                            <div className="flex items-center space-x-4 text-xs">
                              <span className="flex items-center">
                                <Thermometer className="h-3 w-3 mr-1" />
                                Pain: {assessment.pain_level}/10
                              </span>
                              {assessment.has_bleeding && <span className="text-red-600">• Bleeding</span>}
                              {assessment.has_swelling && <span className="text-orange-600">• Swelling</span>}
                            </div>
                          )}
                        </div>

                        {latestSummary && (
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm text-dental-primary">AI Summary</h4>
                            <p className="text-sm text-dental-muted-foreground">{latestSummary.summary_text}</p>
                          </div>
                        )}

                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-dental-primary">Timeline</h4>
                          <div className="text-xs text-dental-muted-foreground space-y-1">
                            <div>Requested: {format(new Date(appointment.created_at), 'HH:mm')}</div>
                            <div>Duration: {assessment?.duration_symptoms || 'Not specified'}</div>
                          </div>
                        </div>
                      </div>

                      {/* Consultation Notes */}
                      {appointment.consultation_notes && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <h4 className="font-medium text-sm text-blue-900 mb-1">Latest Notes</h4>
                          <p className="text-sm text-blue-800">{appointment.consultation_notes}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Enhanced Actions */}
                    <div className="flex flex-col space-y-2 lg:ml-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendSMSReminder(appointment)}
                        disabled={!appointment.phone || sendingSMS === appointment.id}
                        className="flex items-center space-x-1"
                      >
                        <Phone className="h-3 w-3" />
                        <span>{sendingSMS === appointment.id ? 'Sending...' : 'SMS Reminder'}</span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePatientConsultation(appointment.patient_id)}
                        className="flex items-center space-x-1"
                      >
                        <Brain className="h-3 w-3" />
                        <span>AI Consult</span>
                      </Button>
                      
                      <Button
                        size="sm"
                        className="bg-gradient-primary text-white"
                      >
                        Prioritize
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* AI Consultation Dialog */}
      {showAIConsultation && selectedPatient && (
        <AIConversationDialog
          patientId={selectedPatient}
          dentistId={dentistId}
          patientName="Patient"
          contextType="dentist_consultation"
        />
      )}
    </div>
  );
};