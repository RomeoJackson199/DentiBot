import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { InteractiveDentalChat } from "@/components/chat/InteractiveDentalChat";
import { Settings } from "@/components/Settings";
import RealAppointmentsList from "@/components/RealAppointmentsList";
import { EnhancedPatientDossier } from "@/components/enhanced/EnhancedPatientDossier";
import { EmergencyTriageForm } from "@/components/EmergencyTriageForm";
import { PatientAnalytics } from "@/components/analytics/PatientAnalytics";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Calendar, 
  Activity, 
  AlertTriangle,
  Stethoscope,
  Clock,
  BarChart3,
  User as UserIcon,
  Shield,
  Heart,
  Bell,
  FileText,
  Pill,
  Target,
  TrendingUp,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { handleDatabaseError, showErrorToast, retryOperation } from "@/lib/errorHandling";

interface PatientDashboardProps {
  user: User;
}

interface PatientStats {
  upcomingAppointments: number;
  completedAppointments: number;
  healthScore: number;
  lastVisit: string | null;
  totalNotes: number;
  activeTreatmentPlans: number;
  totalPrescriptions: number;
}

interface Appointment {
  id: string;
  appointment_date: string;
  status: string;
  reason: string;
  urgency: string;
  dentist: {
    profile: {
      first_name: string;
      last_name: string;
    };
  };
}

export const PatientDashboard = ({ user }: PatientDashboardProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  type Tab = 'chat' | 'appointments' | 'dossier' | 'analytics' | 'emergency';
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    try {
      return (localStorage.getItem('pd_tab') as Tab) || 'chat';
    } catch {
      return 'chat';
    }
  });
  const [triggerBooking, setTriggerBooking] = useState<'low' | 'medium' | 'high' | 'emergency' | false>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [patientStats, setPatientStats] = useState<PatientStats>({
    upcomingAppointments: 0,
    completedAppointments: 0,
    healthScore: 85,
    lastVisit: null,
    totalNotes: 0,
    activeTreatmentPlans: 0,
    totalPrescriptions: 0
  });
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);

  const handleEmergencyComplete = (urgency: 'low' | 'medium' | 'high' | 'emergency') => {
    setActiveTab('chat');
    setTriggerBooking(urgency);
  };

  useEffect(() => {
    try {
      localStorage.setItem('pd_tab', activeTab);
      localStorage.setItem('session_token', user.id);
    } catch {
      // ignore write errors
    }
  }, [activeTab, user.id]);

  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await retryOperation(async () => {
        const result = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (result.error) throw result.error;
        return result;
      });

      setUserProfile(data);
      
      // Fetch patient statistics
      await fetchPatientStats(data.id);
      await fetchRecentAppointments(data.id);
    } catch (err: any) {
      const errorInfo = handleDatabaseError(err, 'fetchUserProfile');
      setError(errorInfo.userFriendly);
      showErrorToast(errorInfo, 'Profile Loading');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientStats = async (profileId: string) => {
    try {
      // Get appointments
      const { data: appointments } = await retryOperation(async () => {
        const result = await supabase
          .from('appointments')
          .select('*')
          .eq('patient_id', profileId)
          .order('appointment_date', { ascending: false });
        
        if (result.error) throw result.error;
        return result;
      });

      // Get notes
      const { data: notes } = await retryOperation(async () => {
        const result = await supabase
          .from('patient_notes')
          .select('*')
          .eq('patient_id', profileId);
        
        if (result.error) throw result.error;
        return result;
      });

      // Get treatment plans
      const { data: treatmentPlans } = await retryOperation(async () => {
        const result = await supabase
          .from('treatment_plans')
          .select('*')
          .eq('patient_id', profileId)
          .eq('status', 'active');
        
        if (result.error) throw result.error;
        return result;
      });

      // Get prescriptions
      const { data: prescriptions } = await retryOperation(async () => {
        const result = await supabase
          .from('prescriptions')
          .select('*')
          .eq('patient_id', profileId)
          .eq('status', 'active');
        
        if (result.error) throw result.error;
        return result;
      });

      // Calculate stats
      const now = new Date();
      const upcoming = appointments?.filter(apt => 
        new Date(apt.appointment_date) >= now && apt.status !== 'cancelled'
      ).length || 0;

      const completed = appointments?.filter(apt => 
        apt.status === 'completed'
      ).length || 0;

      const lastVisit = appointments?.find(apt => 
        apt.status === 'completed'
      )?.appointment_date || null;

      // Calculate health score based on various factors
      const healthScore = calculateHealthScore(appointments, notes, treatmentPlans);

      setPatientStats({
        upcomingAppointments: upcoming,
        completedAppointments: completed,
        healthScore,
        lastVisit,
        totalNotes: notes?.length || 0,
        activeTreatmentPlans: treatmentPlans?.length || 0,
        totalPrescriptions: prescriptions?.length || 0
      });
    } catch (error) {
      const errorInfo = handleDatabaseError(error, 'fetchPatientStats');
      showErrorToast(errorInfo, 'Statistics Loading');
    }
  };

  const fetchRecentAppointments = async (profileId: string) => {
    try {
      const { data: appointments } = await retryOperation(async () => {
        const result = await supabase
          .from('appointments')
          .select(`
            id,
            appointment_date,
            status,
            reason,
            urgency,
            dentist:dentists(
              profile:profiles(first_name, last_name)
            )
          `)
          .eq('patient_id', profileId)
          .order('appointment_date', { ascending: false })
          .limit(5);
        
        if (result.error) throw result.error;
        return result;
      });

      setRecentAppointments(appointments || []);
    } catch (error) {
      const errorInfo = handleDatabaseError(error, 'fetchRecentAppointments');
      showErrorToast(errorInfo, 'Appointments Loading');
    }
  };

  const calculateHealthScore = (appointments: any[], notes: any[], treatmentPlans: any[]) => {
    let score = 85; // Base score
    
    // Factor in appointment regularity
    const completedAppointments = appointments?.filter(apt => apt.status === 'completed').length || 0;
    if (completedAppointments >= 3) score += 10;
    else if (completedAppointments >= 1) score += 5;
    
    // Factor in active treatment plans (negative impact)
    const activePlans = treatmentPlans?.length || 0;
    score -= activePlans * 5;
    
    // Factor in recent notes (positive impact)
    const recentNotes = notes?.filter(note => {
      const noteDate = new Date(note.created_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return noteDate >= thirtyDaysAgo;
    }).length || 0;
    score += recentNotes * 2;
    
    return Math.max(0, Math.min(100, score));
  };

  const getWelcomeMessage = () => {
    if (!userProfile) return "Welcome to your dashboard!";
    
    const firstName = userProfile.first_name || "User";
    const timeOfDay = new Date().getHours();
    let greeting = "Good morning";
    
    if (timeOfDay >= 12 && timeOfDay < 17) {
      greeting = "Good afternoon";
    } else if (timeOfDay >= 17) {
      greeting = "Good evening";
    }
    
    return `${greeting}, ${firstName}!`;
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getHealthScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-6 w-6 text-green-500" />;
    if (score >= 60) return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
    return <XCircle className="h-6 w-6 text-red-500" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <Card className="glass-card animate-fade-in">
          <CardContent className="p-8 text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin border-b-2 border-dental-primary mx-auto" />
            <h3 className="text-lg font-semibold">Loading Dashboard</h3>
            <p className="text-dental-muted-foreground">Preparing your personalized experience...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <Card className="glass-card animate-fade-in">
          <CardContent className="p-8 text-center space-y-4">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto" />
            <h3 className="text-lg font-semibold">Error Loading Dashboard</h3>
            <p className="text-dental-muted-foreground">{error}</p>
            <Button onClick={fetchUserProfile} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Enhanced Header */}
      <header className="glass-card sticky top-0 z-50 border-0 border-b border-border/20">
        <div className="container mx-auto px-4 py-4 sm:py-6 flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="relative">
              <div className="pulse-ring w-16 h-16 -top-4 -left-4 sm:w-20 sm:h-20 sm:-top-5 sm:-left-5"></div>
              <div className="relative p-2 sm:p-3 rounded-2xl shadow-glow animate-glow bg-white">
                <Stethoscope className="h-6 w-6 sm:h-8 sm:w-8 text-dental-primary" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-secondary rounded-full animate-pulse shadow-float"></div>
            </div>
            <div className="hidden sm:block">
              <h2 className="text-2xl font-bold gradient-text">Denti Bot Unified</h2>
              <p className="text-sm text-dental-muted-foreground">Patient Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Settings user={user} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 lg:py-10">
        {/* Enhanced Welcome Section */}
        <div className="mb-6">
          <Card className="glass-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold gradient-text mb-2">
                    {getWelcomeMessage()}
                  </h1>
                  <p className="text-dental-muted-foreground">
                    Your AI-powered dental assistant is ready to help
                  </p>
                </div>
                <div className="hidden sm:flex items-center space-x-2">
                  <div className="flex items-center space-x-1 text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>AI Assistant Online</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card className="glass-card border-0 hover:shadow-lg transition-shadow">
            <CardContent className="p-4 text-center">
              <Calendar className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{patientStats.upcomingAppointments}</p>
              <p className="text-xs text-dental-muted-foreground">Upcoming</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-0 hover:shadow-lg transition-shadow">
            <CardContent className="p-4 text-center">
              <Activity className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{patientStats.completedAppointments}</p>
              <p className="text-xs text-dental-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-0 hover:shadow-lg transition-shadow">
            <CardContent className="p-4 text-center">
              {getHealthScoreIcon(patientStats.healthScore)}
              <p className={`text-2xl font-bold ${getHealthScoreColor(patientStats.healthScore)}`}>
                {patientStats.healthScore}%
              </p>
              <p className="text-xs text-dental-muted-foreground">Health Score</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-0 hover:shadow-lg transition-shadow">
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 text-orange-500 mx-auto mb-2" />
              <p className="text-sm font-bold">
                {patientStats.lastVisit ? formatDate(patientStats.lastVisit) : 'Never'}
              </p>
              <p className="text-xs text-dental-muted-foreground">Last Visit</p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="glass-card border-0 hover:shadow-lg transition-shadow">
            <CardContent className="p-4 text-center">
              <FileText className="h-5 w-5 text-purple-500 mx-auto mb-2" />
              <p className="text-lg font-bold">{patientStats.totalNotes}</p>
              <p className="text-xs text-dental-muted-foreground">Medical Notes</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-0 hover:shadow-lg transition-shadow">
            <CardContent className="p-4 text-center">
              <Target className="h-5 w-5 text-indigo-500 mx-auto mb-2" />
              <p className="text-lg font-bold">{patientStats.activeTreatmentPlans}</p>
              <p className="text-xs text-dental-muted-foreground">Active Plans</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-0 hover:shadow-lg transition-shadow">
            <CardContent className="p-4 text-center">
              <Pill className="h-5 w-5 text-pink-500 mx-auto mb-2" />
              <p className="text-lg font-bold">{patientStats.totalPrescriptions}</p>
              <p className="text-xs text-dental-muted-foreground">Prescriptions</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Emergency Access */}
        <div className="mb-6">
          <Button
            onClick={() => setActiveTab('emergency')}
            className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-elegant"
            size="lg"
          >
            <AlertTriangle className="h-5 w-5 mr-2" />
            Emergency Assessment
          </Button>
        </div>

        {/* Recent Appointments Preview */}
        {recentAppointments.length > 0 && (
          <div className="mb-6">
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Recent Appointments</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentAppointments.slice(0, 3).map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">{apt.reason}</p>
                          <p className="text-sm text-dental-muted-foreground">
                            Dr. {apt.dentist.profile.first_name} {apt.dentist.profile.last_name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatDate(apt.appointment_date)}</p>
                        <Badge variant={apt.status === 'confirmed' ? 'default' : 'secondary'}>
                          {apt.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced Tab Navigation */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="glass-card rounded-2xl p-2 sm:p-3 animate-fade-in w-full max-w-4xl">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 sm:gap-2">
              <Button
                variant={activeTab === 'chat' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('chat')}
                className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-300 text-xs sm:text-sm ${
                  activeTab === 'chat' 
                    ? 'bg-gradient-primary text-white shadow-elegant scale-105' 
                    : 'text-dental-muted-foreground hover:text-dental-primary hover:bg-dental-primary/10 hover:scale-105'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span className="font-medium">AI Chat</span>
              </Button>
              
              <Button
                variant={activeTab === 'appointments' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('appointments')}
                className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-300 text-xs sm:text-sm ${
                  activeTab === 'appointments' 
                    ? 'bg-gradient-primary text-white shadow-elegant scale-105' 
                    : 'text-dental-muted-foreground hover:text-dental-primary hover:bg-dental-primary/10 hover:scale-105'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Appointments</span>
              </Button>

              <Button
                variant={activeTab === 'dossier' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('dossier')}
                className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-300 text-xs sm:text-sm ${
                  activeTab === 'dossier' 
                    ? 'bg-gradient-primary text-white shadow-elegant scale-105' 
                    : 'text-dental-muted-foreground hover:text-dental-primary hover:bg-dental-primary/10 hover:scale-105'
                }`}
              >
                <Activity className="h-4 w-4" />
                <span className="font-medium">Health</span>
              </Button>

              <Button
                variant={activeTab === 'analytics' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-300 text-xs sm:text-sm ${
                  activeTab === 'analytics' 
                    ? 'bg-gradient-primary text-white shadow-elegant scale-105' 
                    : 'text-dental-muted-foreground hover:text-dental-primary hover:bg-dental-primary/10 hover:scale-105'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span className="font-medium">Analytics</span>
              </Button>

              <Button
                variant={activeTab === 'emergency' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('emergency')}
                className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-300 text-xs sm:text-sm ${
                  activeTab === 'emergency' 
                    ? 'bg-destructive text-white shadow-elegant scale-105' 
                    : 'text-dental-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:scale-105'
                }`}
              >
                <Clock className="h-4 w-4" />
                <span className="font-medium">Urgent</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="animate-fade-in space-y-6">
          {activeTab === 'chat' && (
            <div className="h-[600px]">
              <InteractiveDentalChat
                user={user}
                triggerBooking={triggerBooking}
                onBookingTriggered={() => setTriggerBooking(false)}
              />
            </div>
          )}
          
          {activeTab === 'appointments' && (
            <RealAppointmentsList 
              user={user} 
              onBookNew={() => setActiveTab('chat')}
            />
          )}
          
          {activeTab === 'dossier' && (
            <EnhancedPatientDossier user={user} mode="patient" />
          )}
          
          {activeTab === 'analytics' && (
            <PatientAnalytics userId={user.id} />
          )}
          
          {activeTab === 'emergency' && (
            <EmergencyTriageForm 
              onComplete={handleEmergencyComplete}
              onCancel={() => setActiveTab('chat')}
            />
          )}
        </div>
      </main>
    </>
  );
};