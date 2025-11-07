import { useState, useEffect } from 'react';
import { useBusinessContext } from '@/hooks/useBusinessContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModernLoadingSpinner } from '@/components/enhanced/ModernLoadingSpinner';
import { Calendar, DollarSign, Users, Scissors } from 'lucide-react';

interface DashboardStats {
  todayAppointments: number;
  todayRevenue: number;
  totalClients: number;
  completedToday: number;
}

export function HairdresserDashboard() {
  const { businessId } = useBusinessContext();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    todayRevenue: 0,
    totalClients: 0,
    completedToday: 0,
  });

  useEffect(() => {
    if (businessId) {
      loadDashboard();
    }
  }, [businessId]);

  const loadDashboard = async () => {
    if (!businessId) return;

    try {
      setLoading(true);

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      // Get today's appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select(`
          id,
          status,
          business_services(price_cents)
        `)
        .eq('business_id', businessId)
        .gte('appointment_date', startOfDay.toISOString())
        .lte('appointment_date', endOfDay.toISOString());

      const todayAppointments = appointments?.length || 0;
      const completedToday = appointments?.filter(a => a.status === 'completed').length || 0;
      
      const todayRevenue = appointments
        ?.filter(a => a.status === 'completed')
        .reduce((sum, apt) => {
          const service = Array.isArray(apt.business_services) 
            ? apt.business_services[0] 
            : apt.business_services;
          return sum + (service?.price_cents || 0);
        }, 0) || 0;

      // Get total unique clients (count distinct patient_ids)
      const { data: uniqueClients } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('business_id', businessId);
      
      const totalClients = new Set(uniqueClients?.map(a => a.patient_id) || []).size;

      setStats({
        todayAppointments,
        todayRevenue: todayRevenue / 100,
        totalClients: totalClients || 0,
        completedToday,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <ModernLoadingSpinner variant="overlay" size="lg" message="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">✨ Salon Dashboard</h1>
        <p className="text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedToday} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.todayRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From completed services
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Services Completed</CardTitle>
            <Scissors className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedToday}</div>
            <p className="text-xs text-muted-foreground">
              Today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Welcome Message */}
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Your Salon Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Manage your appointments, clients, and services all in one place. 
            Use the navigation menu to access different features of your salon management system.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
