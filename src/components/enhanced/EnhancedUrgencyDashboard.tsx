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
  Thermometer,
  Users,
  BarChart3,
  Zap,
  Eye,
  Plus,
  Filter,
  Search,
  RefreshCw,
  Bell,
  Star,
  MapPin,
  Mail
} from "lucide-react";
import { format } from "date-fns";
import { AIConversationDialog } from "@/components/AIConversationDialog";
import { AppointmentConfirmationWidget } from "@/components/AppointmentConfirmationWidget";

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
  const [activeFilter, setActiveFilter] = useState<'all' | 'emergency' | 'high' | 'medium' | 'low'>('all');
  const [searchTerm, setSearchTerm] = useState("");
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
          phone,
          patient_id,
          consultation_notes,
          urgency_assessments,
          symptom_summaries
        `)
        .eq('dentist_id', dentistId)
        .order('created_at', { ascending: false });

      if (appointmentsError) throw appointmentsError;

      setAppointments(appointmentsData || []);
      calculateStats(appointmentsData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch urgency data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (appointments: UrgencyAppointment[]) => {
    const today = new Date();
    const todayAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.appointment_date);
      return format(aptDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
    });

    const emergencyCases = appointments.filter(apt => apt.urgency === 'emergency').length;
    const highUrgency = appointments.filter(apt => apt.urgency === 'high').length;
    const completed = appointments.filter(apt => apt.status === 'completed').length;
    const total = appointments.length;

    setStats({
      totalPatients: appointments.length,
      emergencyCases: emergencyCases + highUrgency,
      averageWaitTime: calculateAverageWaitTime(appointments),
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      trends: {
        emergencyIncrease: 15, // Mock data - would calculate from historical data
        waitTimeChange: -5
      }
    });
  };

  const calculateAverageWaitTime = (appointments: UrgencyAppointment[]): number => {
    if (appointments.length === 0) return 0;
    
    const waitTimes = appointments
      .filter(apt => apt.status === 'completed')
      .map(apt => {
        const created = new Date(apt.created_at);
        const completed = new Date(apt.appointment_date);
        return (completed.getTime() - created.getTime()) / (1000 * 60); // minutes
      });
    
    return waitTimes.length > 0 
      ? Math.round(waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length)
      : 0;
  };

  const getUrgencyConfig = (urgency: string) => {
    switch (urgency) {
      case 'emergency':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <AlertTriangle className="h-4 w-4" />,
          bgColor: 'bg-red-50',
          textColor: 'text-red-900'
        };
      case 'high':
        return {
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: <AlertCircle className="h-4 w-4" />,
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-900'
        };
      case 'medium':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Clock className="h-4 w-4" />,
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-900'
        };
      case 'low':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <CheckCircle className="h-4 w-4" />,
          bgColor: 'bg-green-50',
          textColor: 'text-green-900'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <User className="h-4 w-4" />,
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-900'
        };
    }
  };

  const handleSendSMSReminder = async (appointment: UrgencyAppointment) => {
    if (!appointment.phone) {
      toast({
        title: "No Phone Number",
        description: "Patient doesn't have a phone number on file",
        variant: "destructive",
      });
      return;
    }

    setSendingSMS(appointment.id);
    try {
      // Mock SMS sending - would integrate with actual SMS service
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "SMS Sent",
        description: `Reminder sent to ${appointment.patient_name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send SMS reminder",
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

  const filteredAppointments = appointments
    .filter(apt => {
      const matchesFilter = activeFilter === 'all' || apt.urgency === activeFilter;
      const matchesSearch = !searchTerm || 
        apt.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.reason?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      // Sort by urgency first, then by creation time
      const urgencyOrder = { emergency: 0, high: 1, medium: 2, low: 3 };
      const aUrgency = urgencyOrder[a.urgency as keyof typeof urgencyOrder] ?? 4;
      const bUrgency = urgencyOrder[b.urgency as keyof typeof urgencyOrder] ?? 4;
      
      if (aUrgency !== bUrgency) return aUrgency - bUrgency;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dental-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading triage dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Quick Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Emergency Triage Dashboard</h2>
            <p className="text-muted-foreground">Monitor and manage urgent patient cases</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchEnhancedData}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
          <Button className="bg-dental-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Emergency
          </Button>
        </div>
      </div>

      {/* Real-time Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Emergency Cases</p>
                <p className="text-2xl font-bold text-red-900">{stats.emergencyCases}</p>
              </div>
              <div className="p-2 rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-red-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>+{stats.trends.emergencyIncrease}% from yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Patients</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalPatients}</p>
              </div>
              <div className="p-2 rounded-full bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-blue-600">
              <Activity className="h-3 w-3 mr-1" />
              <span>Active today</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Avg Wait Time</p>
                <p className="text-2xl font-bold text-green-900">{stats.averageWaitTime}m</p>
              </div>
              <div className="p-2 rounded-full bg-green-100">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>{stats.trends.waitTimeChange}% improvement</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Completion Rate</p>
                <p className="text-2xl font-bold text-purple-900">{stats.completionRate}%</p>
              </div>
              <div className="p-2 rounded-full bg-purple-100">
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-purple-600">
              <Star className="h-3 w-3 mr-1" />
              <span>Excellent performance</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Search patients by name or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dental-primary focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2">
          {(['all', 'emergency', 'high', 'medium', 'low'] as const).map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(filter)}
              className="capitalize"
            >
              {filter === 'all' ? 'All' : filter}
            </Button>
          ))}
        </div>
      </div>

      {/* Patient Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Patient Queue</h3>
          <Badge variant="secondary">
            {filteredAppointments.length} patients
          </Badge>
        </div>

        {filteredAppointments.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">No patients in queue</p>
                <p className="text-sm">All patients have been attended to</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredAppointments.map((appointment) => {
              const urgencyConfig = getUrgencyConfig(appointment.urgency);
              const isEmergency = appointment.urgency === 'emergency' || appointment.urgency === 'high';
              
              return (
                <Card 
                  key={appointment.id} 
                  className={`glass-card transition-all duration-300 hover:shadow-lg ${
                    isEmergency ? 'border-red-300 bg-red-50/30' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${urgencyConfig.bgColor}`}>
                          {urgencyConfig.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">{appointment.patient_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(appointment.appointment_date), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={urgencyConfig.color}>
                          {appointment.urgency}
                        </Badge>
                        {isEmergency && (
                          <div className="animate-pulse">
                            <Bell className="h-4 w-4 text-red-600" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Reason and Symptoms */}
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-900 mb-1">Reason for Visit</p>
                      <p className="text-sm text-gray-700 bg-white p-2 rounded border">
                        {appointment.reason}
                      </p>
                    </div>

                    {/* Pain Level and Symptoms */}
                    {appointment.urgency_assessments && appointment.urgency_assessments.length > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-1">
                            <Thermometer className="h-4 w-4 text-red-500" />
                            <span>Pain Level: {appointment.urgency_assessments[0].pain_level}/10</span>
                          </div>
                          {appointment.urgency_assessments[0].has_bleeding && (
                            <Badge variant="destructive" className="text-xs">Bleeding</Badge>
                          )}
                          {appointment.urgency_assessments[0].has_swelling && (
                            <Badge variant="destructive" className="text-xs">Swelling</Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="flex items-center space-x-2 pt-3 border-t">
                      <Button
                        size="sm"
                        onClick={() => handlePatientConsultation(appointment.patient_id)}
                        className="flex items-center space-x-1"
                      >
                        <MessageSquare className="h-3 w-3" />
                        <span>AI Consult</span>
                      </Button>
                      
                      {appointment.phone && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendSMSReminder(appointment)}
                          disabled={sendingSMS === appointment.id}
                          className="flex items-center space-x-1"
                        >
                          <Phone className="h-3 w-3" />
                          <span>{sendingSMS === appointment.id ? "Sending..." : "SMS"}</span>
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center space-x-1"
                      >
                        <Eye className="h-3 w-3" />
                        <span>View Details</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Consultation Dialog */}
      {selectedPatient && showAIConsultation && (
        <AIConversationDialog
          patientId={selectedPatient}
          dentistId={dentistId}
          patientName={appointments.find(apt => apt.patient_id === selectedPatient)?.patient_name || 'Patient'}
          contextType="triage"
          onUpdate={() => {
            setShowAIConsultation(false);
            setSelectedPatient(null);
            fetchEnhancedData();
          }}
        />
      )}
    </div>
  );
};