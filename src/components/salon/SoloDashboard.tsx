/**
 * Solo Dashboard - Type A (Solo Stylist)
 *
 * Mobile-first dashboard for single-stylist salons
 * Features:
 * - Today's schedule at a glance
 * - Personal earnings tracking
 * - Quick actions (walk-in, breaks)
 * - Next client preview with notes
 */

import { useState, useEffect } from 'react';
import { useBusinessContext } from '@/hooks/useBusinessContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Clock,
  DollarSign,
  UserPlus,
  Coffee,
  TrendingUp,
  User,
  StickyNote,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ModernLoadingSpinner } from '@/components/enhanced/ModernLoadingSpinner';
import { WalkInManager } from './WalkInManager';
import { BreakManager } from './BreakManager';

interface DailySummary {
  totalClients: number;
  completedClients: number;
  upcomingClients: number;
  revenue: number;
  tips: number;
  nextAppointmentTime: string | null;
  nextClientName: string | null;
  nextClientNotes: string | null;
}

interface TodayAppointment {
  id: string;
  time: string;
  clientName: string;
  serviceName: string;
  duration: number;
  status: string;
  notes?: string;
}

export function SoloDashboard() {
  const { businessId } = useBusinessContext();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
  const [stylistId, setStylistId] = useState<string | null>(null);

  // Dialogs
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [showBreak, setShowBreak] = useState(false);

  useEffect(() => {
    if (!businessId) return;
    loadDashboard();

    // Refresh every 60 seconds
    const interval = setInterval(loadDashboard, 60000);
    return () => clearInterval(interval);
  }, [businessId]);

  const loadDashboard = async () => {
    if (!businessId) return;
    setLoading(true);

    try {
      // Get current user's stylist ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: dentist } = await supabase
        .from('dentists')
        .select('id')
        .eq('profile_id', user.id)
        .single();

      if (!dentist) return;
      setStylistId(dentist.id);

      // Get daily summary using our database function
      const { data: summaryData } = await supabase.rpc('get_solo_daily_summary', {
        stylist_id_param: dentist.id,
        business_id_param: businessId,
        date_param: format(new Date(), 'yyyy-MM-dd'),
      });

      if (summaryData && summaryData.length > 0) {
        const s = summaryData[0];
        setSummary({
          totalClients: s.total_clients || 0,
          completedClients: s.completed_clients || 0,
          upcomingClients: s.upcoming_clients || 0,
          revenue: (s.revenue_cents || 0) / 100,
          tips: (s.tips_cents || 0) / 100,
          nextAppointmentTime: s.next_appointment_time,
          nextClientName: s.next_client_name,
          nextClientNotes: s.next_client_notes,
        });
      }

      // Get today's full appointment list
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const { data: appointments } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          patient_name,
          duration_minutes,
          status,
          appointment_type,
          business_services(name),
          profiles(hair_notes)
        `)
        .eq('dentist_id', dentist.id)
        .eq('business_id', businessId)
        .gte('appointment_date', startOfDay.toISOString())
        .lte('appointment_date', endOfDay.toISOString())
        .order('appointment_date');

      if (appointments) {
        const formatted = appointments
          .filter(a => a.appointment_type === 'service')
          .map(a => {
            const service = Array.isArray(a.business_services) ? a.business_services[0] : a.business_services;
            const profile = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles;
            return {
              id: a.id,
              time: format(new Date(a.appointment_date), 'HH:mm'),
              clientName: a.patient_name || 'Walk-in',
              serviceName: service?.name || 'Service',
              duration: a.duration_minutes || 60,
              status: a.status || 'pending',
              notes: profile?.hair_notes,
            };
          });
        setTodayAppointments(formatted);
      }
    } catch (error) {
      console.error('Error loading solo dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <ModernLoadingSpinner variant="overlay" size="lg" message="Loading your dashboard..." />
      </div>
    );
  }

  const totalEarnings = (summary?.revenue || 0) + (summary?.tips || 0);
  const progressPercent = summary?.totalClients
    ? (summary.completedClients / summary.totalClients) * 100
    : 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Today's Overview</h1>
          <p className="text-muted-foreground">{format(new Date(), 'EEEE, MMMM d')}</p>
        </div>
        <Badge variant="outline" className="text-lg py-2 px-4">
          <Calendar className="mr-2 h-4 w-4" />
          {summary?.upcomingClients || 0} upcoming
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Clients Today */}
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center">
              <User className="mr-2 h-4 w-4" />
              Clients Today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-bold">{summary?.completedClients || 0}</span>
              <span className="text-muted-foreground">/ {summary?.totalClients || 0}</span>
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Earnings Today */}
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center">
              <DollarSign className="mr-2 h-4 w-4" />
              Earnings Today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">
              €{totalEarnings.toFixed(2)}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Services €{summary?.revenue.toFixed(2) || '0.00'} + Tips €{summary?.tips.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Quick Actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="default"
              size="sm"
              className="w-full"
              onClick={() => setShowWalkIn(true)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add Walk-in
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowBreak(true)}
            >
              <Coffee className="mr-2 h-4 w-4" />
              Take Break
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Next Client Card */}
      {summary?.nextClientName && summary?.nextAppointmentTime && (
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Clock className="mr-2 h-5 w-5 text-primary" />
              Next Client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-2xl font-semibold">{summary.nextClientName}</div>
                <div className="text-lg text-muted-foreground mt-1">
                  {format(new Date(summary.nextAppointmentTime), 'h:mm a')}
                </div>
                {summary.nextClientNotes && (
                  <div className="mt-3 flex items-start text-sm bg-background p-3 rounded-md">
                    <StickyNote className="mr-2 h-4 w-4 mt-0.5 text-yellow-600" />
                    <span>{summary.nextClientNotes}</span>
                  </div>
                )}
              </div>
              <Button variant="ghost" size="sm">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
          <CardDescription>
            {todayAppointments.length} appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayAppointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="mx-auto h-12 w-12 mb-3 opacity-50" />
              <p>No appointments scheduled for today</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setShowWalkIn(true)}
              >
                Add Walk-in
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((apt, idx) => (
                <div key={apt.id}>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col items-center min-w-[60px]">
                        <span className="text-sm font-medium">{apt.time}</span>
                        <span className="text-xs text-muted-foreground">{apt.duration}m</span>
                      </div>
                      <div>
                        <div className="font-semibold">{apt.clientName}</div>
                        <div className="text-sm text-muted-foreground">{apt.serviceName}</div>
                        {apt.notes && (
                          <div className="text-xs text-muted-foreground mt-1 flex items-center">
                            <StickyNote className="mr-1 h-3 w-3" />
                            {apt.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={
                        apt.status === 'completed'
                          ? 'default'
                          : apt.status === 'in_progress'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {apt.status}
                    </Badge>
                  </div>
                  {idx < todayAppointments.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <WalkInManager
        open={showWalkIn}
        onOpenChange={setShowWalkIn}
        preselectedStylistId={stylistId || undefined}
      />

      <BreakManager
        open={showBreak}
        onOpenChange={setShowBreak}
        stylistId={stylistId || ''}
        businessId={businessId || ''}
        onComplete={() => {
          setShowBreak(false);
          loadDashboard();
        }}
      />
    </div>
  );
}
