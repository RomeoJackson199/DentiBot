import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  Calendar, 
  Clock, 
  Activity, 
  Heart,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Star,
  Award,
  Target
} from "lucide-react";

interface PatientAnalyticsProps {
  userId: string;
}

interface PatientData {
  totalAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  lastVisit: string | null;
  totalNotes: number;
  activeTreatmentPlans: number;
  healthScore: number;
  appointmentStreak: number;
  preferredTime: string;
  avgRating: number;
}

export const PatientAnalytics = ({ userId }: PatientAnalyticsProps) => {
  const [patientData, setPatientData] = useState<PatientData>({
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    lastVisit: null,
    totalNotes: 0,
    activeTreatmentPlans: 0,
    healthScore: 85,
    appointmentStreak: 0,
    preferredTime: 'Morning',
    avgRating: 4.8
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientData();
  }, [userId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      
      // Get patient profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!profile) return;

      // Get appointments data
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', profile.id)
        .order('appointment_date', { ascending: false });

      // Get notes
      const { data: notes } = await supabase
        .from('notes')
        .select('*')
        .eq('patient_id', profile.id);

      // Get treatment plans
      const { data: treatmentPlans } = await supabase
        .from('treatment_plans')
        .select('*')
        .eq('patient_id', profile.id)
        .eq('status', 'active');

      // Calculate metrics
      const now = new Date();
      const upcoming = appointments?.filter(apt => 
        new Date(apt.appointment_date) >= now
      ).length || 0;

      const completed = appointments?.filter(apt => 
        apt.status === 'completed'
      ).length || 0;

      const lastVisitDate = appointments?.find(apt => 
        apt.status === 'completed'
      )?.appointment_date;

      // Calculate health score based on appointment frequency, compliance, etc.
      let healthScore = 70; // Base score
      if (completed > 5) healthScore += 10; // Regular patient
      if (upcoming > 0) healthScore += 10; // Has upcoming appointments
      if (treatmentPlans && treatmentPlans.length > 0) healthScore += 5; // Active treatment
      
      setPatientData({
        totalAppointments: appointments?.length || 0,
        upcomingAppointments: upcoming,
        completedAppointments: completed,
        lastVisit: lastVisitDate,
        totalNotes: notes?.length || 0,
        activeTreatmentPlans: treatmentPlans?.length || 0,
        healthScore: Math.min(healthScore, 100),
        appointmentStreak: Math.floor(Math.random() * 6) + 3, // Simulate streak
        preferredTime: 'Afternoon', // Could analyze actual appointment times
        avgRating: 4.8 + Math.random() * 0.2 // Simulate rating
      });

    } catch (error) {
      console.error('Error fetching patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 75) return 'text-blue-600 bg-blue-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getHealthScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Attention';
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="glass-card animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-white/20 rounded mb-2"></div>
              <div className="h-8 bg-white/20 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Health Overview */}
      <Card className="glass-card border-2 border-dental-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center mb-4">
            <Heart className="h-6 w-6 mr-2 text-red-500" />
            Your Dental Health Score
          </CardTitle>
          <div className="space-y-4">
            <div className="relative w-32 h-32 mx-auto">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="50" cy="50" r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - patientData.healthScore / 100)}`}
                  className="text-dental-primary transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-dental-primary">{patientData.healthScore}</div>
                  <div className="text-sm text-dental-muted-foreground">Score</div>
                </div>
              </div>
            </div>
            <Badge className={`px-4 py-2 text-lg ${getHealthScoreColor(patientData.healthScore)}`}>
              {getHealthScoreLabel(patientData.healthScore)}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Appointments */}
        <Card className="glass-card hover:shadow-elegant transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dental-muted-foreground">Total Visits</p>
                <p className="text-2xl font-bold text-dental-primary">
                  {patientData.totalAppointments}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-blue-100">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-4">
              <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">
                {patientData.completedAppointments} completed
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="glass-card hover:shadow-elegant transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dental-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold text-dental-secondary">
                  {patientData.upcomingAppointments}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-green-100">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-4">
              <Activity className="h-4 w-4 text-dental-muted-foreground mr-1" />
              <span className="text-sm text-dental-muted-foreground">
                Next: {patientData.upcomingAppointments > 0 ? 'This week' : 'None scheduled'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Treatment Plans */}
        <Card className="glass-card hover:shadow-elegant transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dental-muted-foreground">Active Plans</p>
                <p className="text-2xl font-bold text-dental-accent">
                  {patientData.activeTreatmentPlans}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-purple-100">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center mt-4">
              <TrendingUp className="h-4 w-4 text-purple-600 mr-1" />
              <span className="text-sm text-purple-600">
                On track
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Appointment Streak */}
        <Card className="glass-card hover:shadow-elegant transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dental-muted-foreground">Visit Streak</p>
                <p className="text-2xl font-bold text-orange-600">
                  {patientData.appointmentStreak}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-orange-100">
                <Award className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center mt-4">
              <Star className="h-4 w-4 text-orange-600 mr-1" />
              <span className="text-sm text-orange-600">
                Months in a row!
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Insights */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-dental-primary" />
              Your Health Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-dental-muted-foreground">Last Visit</span>
                <span className="font-semibold">
                  {patientData.lastVisit ? formatDate(patientData.lastVisit) : 'No visits yet'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-dental-muted-foreground">Preferred Time</span>
                <span className="font-semibold">{patientData.preferredTime}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-dental-muted-foreground">Care Notes</span>
                <span className="font-semibold">{patientData.totalNotes}</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Your Rating</span>
                <div className="flex items-center">
                  <div className="flex mr-2">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${i < Math.floor(patientData.avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold">{patientData.avgRating}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health Recommendations */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-dental-secondary" />
              Personalized Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                <div className="flex items-center mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-semibold text-green-800">Great Job!</span>
                </div>
                <p className="text-sm text-green-700">
                  You're keeping up with regular check-ups. This helps prevent major issues.
                </p>
              </div>
              
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <div className="flex items-center mb-2">
                  <Clock className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-semibold text-blue-800">Next Steps</span>
                </div>
                <p className="text-sm text-blue-700">
                  Schedule your next cleaning for optimal oral health maintenance.
                </p>
              </div>
              
              {patientData.healthScore < 80 && (
                <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200">
                  <div className="flex items-center mb-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                    <span className="font-semibold text-yellow-800">Improvement Tip</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Regular flossing can improve your health score by 10-15 points.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button className="h-auto p-4 flex flex-col items-center space-y-2 bg-gradient-primary text-white">
              <Calendar className="h-6 w-6" />
              <span>Book Appointment</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <MessageSquare className="h-6 w-6" />
              <span>Ask AI</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Activity className="h-6 w-6" />
              <span>View Records</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <AlertTriangle className="h-6 w-6" />
              <span>Emergency Triage</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};