import React, { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useMediaQuery } from "@/hooks/use-media-query";
import { format, formatDistanceToNow, addDays, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  Calendar,
  CreditCard,
  MessageSquare,
  Pill,
  MapPin,
  Clock,
  ChevronRight,
  AlertCircle,
  CalendarPlus,
  Navigation,
  FileText,
  DollarSign,
  Bot,
  CheckCircle,
  Activity
} from "lucide-react";

interface HomePageProps {
  user: User;
  profile: any;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  service_type: string;
  dentist_id: string;
  dentist?: {
    full_name: string;
    specialization: string;
  };
}

interface Prescription {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface TreatmentPlan {
  id: string;
  title: string;
  status: string;
  progress: number;
  next_step: string;
  next_step_date: string;
}

interface PaymentSummary {
  total_due: number;
  pending_invoices: Array<{
    id: string;
    amount: number;
    due_date: string;
    description: string;
  }>;
}

export const HomePage: React.FC<HomePageProps> = ({ user, profile }) => {
  const [loading, setLoading] = useState(true);
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);
  const { toast } = useToast();
  
  const isMobile = useMediaQuery("(max-width: 599px)");
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    fetchDashboardData();
  }, [user.id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [appointmentsRes, prescriptionsRes, treatmentPlansRes, paymentsRes] = await Promise.all([
        // Next appointment
        supabase
          .from('appointments')
          .select(`
            *,
            dentist:dentists(
              full_name,
              specialization
            )
          `)
          .eq('patient_id', user.id)
          .eq('status', 'confirmed')
          .gte('appointment_date', new Date().toISOString().split('T')[0])
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true })
          .limit(1)
          .single(),
        
        // Active prescriptions
        supabase
          .from('prescriptions')
          .select('*')
          .eq('patient_id', user.id)
          .eq('status', 'active')
          .order('end_date', { ascending: true }),
        
        // Active treatment plans
        supabase
          .from('treatment_plans')
          .select('*')
          .eq('patient_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false }),
        
        // Pending payments
        supabase
          .from('payment_requests')
          .select('*')
          .eq('patient_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
      ]);

      if (!appointmentsRes.error && appointmentsRes.data) {
        setNextAppointment(appointmentsRes.data);
      }

      if (!prescriptionsRes.error && prescriptionsRes.data) {
        setPrescriptions(prescriptionsRes.data);
        
        // Check for expiring prescriptions
        const expiringPrescriptions = prescriptionsRes.data.filter(p => {
          const daysUntilExpiry = Math.ceil((new Date(p.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          return daysUntilExpiry <= 3 && daysUntilExpiry > 0;
        });
        
        if (expiringPrescriptions.length > 0) {
          setAlerts(prev => [...prev, `Prescription expires in ${expiringPrescriptions.length} days`]);
        }
      }

      if (!treatmentPlansRes.error && treatmentPlansRes.data) {
        setTreatmentPlans(treatmentPlansRes.data);
      }

      if (!paymentsRes.error && paymentsRes.data) {
        const totalDue = paymentsRes.data.reduce((sum, payment) => sum + payment.amount, 0);
        setPaymentSummary({
          total_due: totalDue,
          pending_invoices: paymentsRes.data.map(p => ({
            id: p.id,
            amount: p.amount,
            due_date: p.created_at,
            description: p.description || 'Payment request'
          }))
        });
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = () => {
    // Navigate to appointments page
    window.location.href = '/dashboard?tab=appointments';
  };

  const handleViewPrescriptions = () => {
    // Navigate to care page
    window.location.href = '/dashboard?tab=care';
  };

  const handlePayBalance = () => {
    // Navigate to payments page
    window.location.href = '/dashboard?tab=payments';
  };

  const handleAIAssistant = () => {
    // Open AI chat dialog
    const event = new CustomEvent('openAIChat');
    window.dispatchEvent(event);
  };

  const quickActions = [
    { 
      id: 'book', 
      label: 'Book Appointment', 
      icon: CalendarPlus, 
      onClick: handleBookAppointment,
      color: 'text-blue-600 bg-blue-50 hover:bg-blue-100'
    },
    { 
      id: 'prescriptions', 
      label: 'View Prescriptions', 
      icon: Pill, 
      onClick: handleViewPrescriptions,
      color: 'text-green-600 bg-green-50 hover:bg-green-100'
    },
    ...(paymentSummary && paymentSummary.total_due > 0 ? [{
      id: 'pay', 
      label: 'Pay Balance', 
      icon: CreditCard, 
      onClick: handlePayBalance,
      color: 'text-orange-600 bg-orange-50 hover:bg-orange-100'
    }] : []),
    { 
      id: 'ai', 
      label: 'AI Assistant', 
      icon: Bot, 
      onClick: handleAIAssistant,
      color: 'text-purple-600 bg-purple-50 hover:bg-purple-100'
    }
  ];

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {firstName}!</h1>
          <p className="text-muted-foreground">Here's your health overview for today</p>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            {alerts.map((alert, index) => (
              <div key={index}>{alert}</div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Actions */}
      <div className={cn(
        "grid gap-4",
        isMobile ? "grid-cols-2" : "grid-cols-4"
      )}>
        {quickActions.map((action) => (
          <Button
            key={action.id}
            variant="outline"
            className={cn(
              "h-24 flex-col gap-2 border-2",
              action.color
            )}
            onClick={action.onClick}
          >
            <action.icon className="h-6 w-6" />
            <span className="text-xs font-medium">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Next Appointment Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Next Appointment
          </CardTitle>
        </CardHeader>
        <CardContent>
          {nextAppointment ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="font-semibold">
                    {format(new Date(nextAppointment.appointment_date), 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {nextAppointment.appointment_time} • {nextAppointment.service_type}
                  </p>
                  <p className="text-sm">
                    Dr. {nextAppointment.dentist?.full_name}
                  </p>
                </div>
                <Badge variant="secondary">
                  {nextAppointment.status}
                </Badge>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline">
                  <Clock className="h-4 w-4 mr-1" />
                  Reschedule
                </Button>
                <Button size="sm" variant="outline">
                  <Navigation className="h-4 w-4 mr-1" />
                  Directions
                </Button>
                <Button size="sm" variant="outline">
                  <CalendarPlus className="h-4 w-4 mr-1" />
                  Add to Calendar
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No upcoming appointments</p>
              <Button onClick={handleBookAppointment}>
                <CalendarPlus className="h-4 w-4 mr-2" />
                Book Appointment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Treatment Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Treatment Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Active Prescriptions */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Pill className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Active Prescriptions</p>
                <p className="text-sm text-muted-foreground">
                  {prescriptions.length > 0 
                    ? `${prescriptions.length} active • Next expires ${format(new Date(prescriptions[0]?.end_date), 'MMM d')}`
                    : 'No active prescriptions'
                  }
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Treatment Plans */}
          {treatmentPlans.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium">Active Treatment Plans</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    {treatmentPlans[0].title}
                  </p>
                  <Progress value={treatmentPlans[0].progress || 30} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Next: {treatmentPlans[0].next_step}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          )}

          {/* Last Check-up */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium">Last Check-up</p>
                <p className="text-sm text-muted-foreground">
                  3 months ago • Next due in 3 months
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {/* Payments Snapshot */}
      {paymentSummary && paymentSummary.total_due > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-orange-600" />
              Payment Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">${paymentSummary.total_due.toFixed(2)}</p>
                <Button size="sm" onClick={handlePayBalance}>
                  Pay Now
                </Button>
              </div>
              
              <div className="space-y-2">
                {paymentSummary.pending_invoices.slice(0, 2).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{invoice.description}</span>
                    <span className="font-medium">${invoice.amount.toFixed(2)}</span>
                  </div>
                ))}
                {paymentSummary.pending_invoices.length > 2 && (
                  <Button variant="link" size="sm" className="p-0 h-auto" onClick={handlePayBalance}>
                    View all {paymentSummary.pending_invoices.length} pending payments
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!paymentSummary || paymentSummary.total_due === 0 && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="font-medium text-green-800">You're all set - no payments due!</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};