import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useBusinessContext } from '@/hooks/useBusinessContext';
import { TeamStatusBoard } from './TeamStatusBoard';
import { WalkInManager } from './WalkInManager';
import { CheckoutList } from './CheckoutList';
import { DollarSign, Users, TrendingUp, Clock, Calendar, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface DailyRevenue {
  serviceRevenue: number;
  productRevenue: number;
  tips: number;
  total: number;
  clientsServed: number;
}

interface UpcomingAppointment {
  id: string;
  time: Date;
  clientName: string;
  serviceName: string;
  stylistName: string;
}

export function SalonDashboard() {
  const { businessId } = useBusinessContext();
  const navigate = useNavigate();
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue>({
    serviceRevenue: 0,
    productRevenue: 0,
    tips: 0,
    total: 0,
    clientsServed: 0,
  });
  const [dailyGoal, setDailyGoal] = useState(1800); // €1,800 default
  const [showWalkInDialog, setShowWalkInDialog] = useState(false);
  const [showCheckoutList, setShowCheckoutList] = useState(false);
  const [selectedStylistForWalkIn, setSelectedStylistForWalkIn] = useState<string | undefined>();
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);

  useEffect(() => {
    if (!businessId) return;

    loadDashboardData();

    // Refresh every minute
    const interval = setInterval(loadDashboardData, 60000);

    return () => clearInterval(interval);
  }, [businessId]);

  const loadDashboardData = async () => {
    if (!businessId) return;

    // Load daily revenue
    const { data: revenueData } = await supabase.rpc('get_daily_revenue', {
      business_id_param: businessId,
      date_param: format(new Date(), 'yyyy-MM-dd'),
    });

    if (revenueData && revenueData[0]) {
      const rev = revenueData[0];
      setDailyRevenue({
        serviceRevenue: (rev.service_revenue_cents || 0) / 100,
        productRevenue: (rev.product_revenue_cents || 0) / 100,
        tips: (rev.tips_cents || 0) / 100,
        total: (rev.total_revenue_cents || 0) / 100,
        clientsServed: rev.clients_served || 0,
      });
    }

    // Load business daily goal
    const { data: businessData } = await supabase
      .from('businesses')
      .select('daily_revenue_goal_cents')
      .eq('id', businessId)
      .single();

    if (businessData?.daily_revenue_goal_cents) {
      setDailyGoal(businessData.daily_revenue_goal_cents / 100);
    }

    // Load upcoming appointments (next 2 hours)
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const { data: appointmentsData } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        patient_name,
        business_services(name),
        dentists(profiles(first_name, last_name))
      `)
      .eq('business_id', businessId)
      .gte('appointment_date', now.toISOString())
      .lte('appointment_date', twoHoursFromNow.toISOString())
      .in('status', ['confirmed', 'pending'])
      .order('appointment_date')
      .limit(10);

    if (appointmentsData) {
      setUpcomingAppointments(
        appointmentsData.map((appt: any) => ({
          id: appt.id,
          time: new Date(appt.appointment_date),
          clientName: appt.patient_name,
          serviceName: appt.business_services?.name || 'Service',
          stylistName: appt.dentists?.profiles
            ? `${appt.dentists.profiles.first_name} ${appt.dentists.profiles.last_name}`
            : 'Unknown',
        }))
      );
    }
  };

  const handleAssignWalkIn = (stylistId: string) => {
    setSelectedStylistForWalkIn(stylistId);
    setShowWalkInDialog(true);
  };

  const revenueProgress = dailyGoal > 0 ? (dailyRevenue.total / dailyGoal) * 100 : 0;
  const progressColor =
    revenueProgress >= 100
      ? 'bg-green-500'
      : revenueProgress >= 70
      ? 'bg-blue-500'
      : revenueProgress >= 40
      ? 'bg-yellow-500'
      : 'bg-red-500';

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">✨ Salon Dashboard</h1>
          <p className="text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Current Time</p>
          <p className="text-2xl font-bold">{format(new Date(), 'h:mm a')}</p>
        </div>
      </div>

      {/* Revenue Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Today's Revenue
            </span>
            <Badge variant={revenueProgress >= 70 ? 'default' : 'secondary'} className="text-lg">
              {revenueProgress.toFixed(0)}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-4xl font-bold">€{dailyRevenue.total.toFixed(2)}</span>
              <span className="text-lg text-muted-foreground">
                / €{dailyGoal.toFixed(0)} goal
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full ${progressColor} transition-all duration-500`}
                style={{ width: `${Math.min(revenueProgress, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Services</p>
              <p className="font-semibold text-lg">
                €{dailyRevenue.serviceRevenue.toFixed(0)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Products</p>
              <p className="font-semibold text-lg">
                €{dailyRevenue.productRevenue.toFixed(0)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Tips</p>
              <p className="font-semibold text-lg">€{dailyRevenue.tips.toFixed(0)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {dailyRevenue.clientsServed} clients served today
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4">
        <Button
          size="lg"
          className="h-24 flex flex-col gap-2"
          onClick={() => setShowWalkInDialog(true)}
        >
          <Users className="h-6 w-6" />
          <span>Add Walk-in</span>
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-24 flex flex-col gap-2"
          onClick={() => setShowCheckoutList(true)}
        >
          <ShoppingBag className="h-6 w-6" />
          <span>Check Out</span>
        </Button>
        <Button 
          size="lg" 
          variant="outline" 
          className="h-24 flex flex-col gap-2"
          onClick={() => navigate('/dentist/appointments')}
        >
          <Calendar className="h-6 w-6" />
          <span>View Day</span>
        </Button>
      </div>

      {/* Team Status Board */}
      <TeamStatusBoard onAssignWalkIn={handleAssignWalkIn} />

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming (Next 2 Hours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-sm font-semibold">{format(appt.time, 'h:mm')}</p>
                      <p className="text-xs text-muted-foreground">{format(appt.time, 'a')}</p>
                    </div>
                    <div>
                      <p className="font-semibold">{appt.clientName}</p>
                      <p className="text-sm text-muted-foreground">{appt.serviceName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{appt.stylistName}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Walk-in Dialog */}
      <WalkInManager
        open={showWalkInDialog}
        onOpenChange={setShowWalkInDialog}
        preselectedStylistId={selectedStylistForWalkIn}
      />

      {/* Checkout List Dialog */}
      <CheckoutList
        open={showCheckoutList}
        onOpenChange={setShowCheckoutList}
      />
    </div>
  );
}
