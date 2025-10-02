import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, DollarSign, Calendar, Users } from "lucide-react";

interface FilteredAnalyticsProps {
  dentistId: string;
}

export function FilteredAnalytics({ dentistId }: FilteredAnalyticsProps) {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  const getDateRange = () => {
    const now = new Date();
    switch (period) {
      case 'week':
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'year':
        return { start: startOfYear(now), end: endOfYear(now) };
    }
  };

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', dentistId, period],
    queryFn: async () => {
      const { start, end } = getDateRange();

      // Get revenue
      const { data: payments } = await supabase
        .from('payment_records')
        .select('amount, payment_date')
        .eq('dentist_id', dentistId)
        .eq('payment_status', 'completed')
        .gte('payment_date', start.toISOString())
        .lte('payment_date', end.toISOString());

      const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // Get appointments
      const { data: appointments, count: totalAppointments } = await supabase
        .from('appointments')
        .select('*', { count: 'exact' })
        .eq('dentist_id', dentistId)
        .gte('appointment_date', start.toISOString())
        .lte('appointment_date', end.toISOString());

      const completedAppointments = appointments?.filter(a => a.status === 'completed').length || 0;
      const cancelledAppointments = appointments?.filter(a => a.status === 'cancelled').length || 0;
      const noShowRate = totalAppointments ? (cancelledAppointments / totalAppointments) * 100 : 0;

      // Get unique patients
      const uniquePatients = new Set(appointments?.map(a => a.patient_id) || []).size;

      // Calculate chair utilization (assuming 8-hour days, 30-min slots)
      const workDays = period === 'week' ? 5 : period === 'month' ? 20 : 240;
      const totalSlots = workDays * 16; // 16 slots per day
      const utilization = totalAppointments ? (totalAppointments / totalSlots) * 100 : 0;

      return {
        totalRevenue,
        totalAppointments: totalAppointments || 0,
        completedAppointments,
        uniquePatients,
        noShowRate,
        chairUtilization: utilization,
      };
    },
  });

  if (isLoading) {
    return <div className="p-4">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{analytics?.totalRevenue.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {period === 'week' ? 'This week' : period === 'month' ? 'This month' : 'This year'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalAppointments || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.completedAppointments || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patients Seen</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.uniquePatients || 0}</div>
            <p className="text-xs text-muted-foreground">Unique patients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chair Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.chairUtilization.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              No-show rate: {analytics?.noShowRate.toFixed(1) || 0}%
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
