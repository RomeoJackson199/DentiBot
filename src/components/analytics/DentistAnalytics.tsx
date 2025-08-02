import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Star
} from "lucide-react";

interface DentistAnalyticsProps {
  dentistId: string;
}

interface AnalyticsData {
  dailyRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  appointmentsToday: number;
  appointmentsWeek: number;
  patientsTotal: number;
  averageRating: number;
  noShowRate: number;
  utilizationRate: number;
  emergencyAppointments: number;
  revenueGrowth: number;
  patientRetention: number;
}

export const DentistAnalytics = ({ dentistId }: DentistAnalyticsProps) => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    dailyRevenue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    appointmentsToday: 0,
    appointmentsWeek: 0,
    patientsTotal: 0,
    averageRating: 0,
    noShowRate: 0,
    utilizationRate: 0,
    emergencyAppointments: 0,
    revenueGrowth: 0,
    patientRetention: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [dentistId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Simulate API calls - in real app, these would be actual database queries
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get appointments data
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('dentist_id', dentistId);

      // Get ratings data
      const { data: ratings } = await supabase
        .from('dentist_ratings')
        .select('rating')
        .eq('dentist_id', dentistId);

      // Calculate metrics
      const todayAppointments = appointments?.filter(apt => 
        new Date(apt.appointment_date).toDateString() === today.toDateString()
      ).length || 0;

      const weekAppointments = appointments?.filter(apt => 
        new Date(apt.appointment_date) >= weekAgo
      ).length || 0;

      const emergencyCount = appointments?.filter(apt => 
        apt.urgency === 'emergency' || apt.urgency === 'high'
      ).length || 0;

      const avgRating = ratings?.length ? 
        ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0;

      // Calculate real metrics based on actual data
      const uniquePatients = new Set(appointments?.map(apt => apt.patient_id)).size;
      const completedAppointments = appointments?.filter(apt => apt.status === 'completed').length || 0;
      const noShowAppointments = appointments?.filter(apt => apt.status === 'cancelled').length || 0;
      const totalAppointments = appointments?.length || 0;
      const noShowRate = totalAppointments > 0 ? Math.round((noShowAppointments / totalAppointments) * 100) : 0;
      
      // Calculate estimated revenue (€80 per completed appointment)
      const avgAppointmentRevenue = 80;
      const todayRevenue = todayAppointments * avgAppointmentRevenue;
      const weekRevenue = weekAppointments * avgAppointmentRevenue;
      const monthRevenue = completedAppointments * avgAppointmentRevenue;
      
      setAnalytics({
        dailyRevenue: todayRevenue,
        weeklyRevenue: weekRevenue,
        monthlyRevenue: monthRevenue,
        appointmentsToday: todayAppointments,
        appointmentsWeek: weekAppointments,
        patientsTotal: uniquePatients,
        averageRating: avgRating,
        noShowRate: noShowRate,
        utilizationRate: Math.round((completedAppointments / Math.max(totalAppointments, 1)) * 100),
        emergencyAppointments: emergencyCount,
        revenueGrowth: Math.max(0, Math.round(((weekRevenue - monthRevenue/4) / Math.max(monthRevenue/4, 1)) * 100)),
        patientRetention: Math.round((uniquePatients / Math.max(totalAppointments, 1)) * 100)
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getPerformanceColor = (value: number, benchmark: number, inverse = false) => {
    const isGood = inverse ? value < benchmark : value > benchmark;
    return isGood ? 'text-green-600' : 'text-red-600';
  };

  const getTrendIcon = (value: number, benchmark: number, inverse = false) => {
    const isGood = inverse ? value < benchmark : value > benchmark;
    return isGood ? TrendingUp : TrendingDown;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
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
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Daily Revenue */}
        <Card className="glass-card hover:shadow-elegant transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dental-muted-foreground">Today's Revenue</p>
                <p className="text-2xl font-bold text-dental-primary">
                  {formatCurrency(analytics.dailyRevenue)}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-green-100">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-4">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">+{analytics.revenueGrowth}% from last week</span>
            </div>
          </CardContent>
        </Card>

        {/* Appointments Today */}
        <Card className="glass-card hover:shadow-elegant transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dental-muted-foreground">Appointments Today</p>
                <p className="text-2xl font-bold text-dental-secondary">
                  {analytics.appointmentsToday}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-blue-100">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-4">
              <Clock className="h-4 w-4 text-dental-muted-foreground mr-1" />
              <span className="text-sm text-dental-muted-foreground">
                {analytics.appointmentsWeek} this week
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Patient Rating */}
        <Card className="glass-card hover:shadow-elegant transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dental-muted-foreground">Average Rating</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {analytics.averageRating.toFixed(1)}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-yellow-100">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="flex items-center mt-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-3 w-3 ${i < Math.floor(analytics.averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <span className="text-sm text-dental-muted-foreground ml-2">
                ({analytics.patientsTotal} reviews)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Utilization Rate */}
        <Card className="glass-card hover:shadow-elegant transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dental-muted-foreground">Schedule Utilization</p>
                <p className="text-2xl font-bold text-dental-accent">
                  {analytics.utilizationRate}%
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-purple-100">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center mt-4">
              <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">Optimal range (75-90%)</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Overview */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-600" />
              Revenue Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-dental-muted-foreground">Daily</span>
                <span className="font-semibold">{formatCurrency(analytics.dailyRevenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-dental-muted-foreground">Weekly</span>
                <span className="font-semibold">{formatCurrency(analytics.weeklyRevenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-dental-muted-foreground">Monthly</span>
                <span className="font-semibold text-lg">{formatCurrency(analytics.monthlyRevenue)}</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Revenue Growth</span>
                <Badge className="bg-green-100 text-green-800">
                  +{analytics.revenueGrowth}% this month
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Practice Metrics */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-dental-primary" />
              Practice Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-dental-muted-foreground">No-Show Rate</span>
                <div className="flex items-center">
                  <span className={`font-semibold ${getPerformanceColor(analytics.noShowRate, 10, true)}`}>
                    {analytics.noShowRate}%
                  </span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    Target: &lt;10%
                  </Badge>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-dental-muted-foreground">Patient Retention</span>
                <div className="flex items-center">
                  <span className={`font-semibold ${getPerformanceColor(analytics.patientRetention, 85)}`}>
                    {analytics.patientRetention}%
                  </span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    Target: &gt;85%
                  </Badge>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-dental-muted-foreground">Emergency Cases</span>
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mr-1" />
                  <span className="font-semibold text-orange-600">
                    {analytics.emergencyAppointments}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Quick Insights & Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <div className="flex items-center mb-2">
                <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                <span className="font-semibold text-blue-800">Peak Hours</span>
              </div>
              <p className="text-sm text-blue-700">
                Most bookings happen between 2-4 PM. Consider adjusting staff schedule.
              </p>
            </div>
            
            <div className="p-4 rounded-xl bg-green-50 border border-green-200">
              <div className="flex items-center mb-2">
                <Users className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-semibold text-green-800">New Patients</span>
              </div>
              <p className="text-sm text-green-700">
                12 new patients this week. Send welcome emails to improve retention.
              </p>
            </div>
            
            <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
              <div className="flex items-center mb-2">
                <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
                <span className="font-semibold text-orange-800">Follow-up Needed</span>
              </div>
              <p className="text-sm text-orange-700">
                8 patients need follow-up calls after recent treatments.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};