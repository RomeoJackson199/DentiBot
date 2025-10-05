import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { DollarSign, Users, Calendar, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { startOfWeek, startOfMonth, startOfYear, endOfWeek, endOfMonth, endOfYear } from "date-fns";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

type Period = 'week' | 'month' | 'year';

export function EnhancedAnalytics({ dentistId }: { dentistId: string }) {
  const [period, setPeriod] = useState<Period>('month');

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

  const { start, end } = getDateRange();

  // Revenue analytics
  const { data: revenueData } = useQuery({
    queryKey: ['revenue-analytics', dentistId, period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_records')
        .select('amount, payment_date, payment_method')
        .eq('dentist_id', dentistId)
        .eq('payment_status', 'completed')
        .gte('payment_date', start.toISOString())
        .lte('payment_date', end.toISOString());

      if (error) throw error;

      const total = data.reduce((sum, p) => sum + Number(p.amount), 0);
      const byMethod = data.reduce((acc, p) => {
        acc[p.payment_method] = (acc[p.payment_method] || 0) + Number(p.amount);
        return acc;
      }, {} as Record<string, number>);

      return { total, byMethod, records: data };
    }
  });

  // Appointment analytics
  const { data: appointmentData } = useQuery({
    queryKey: ['appointment-analytics', dentistId, period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, status, appointment_date, urgency, duration_minutes')
        .eq('dentist_id', dentistId)
        .gte('appointment_date', start.toISOString())
        .lte('appointment_date', end.toISOString());

      if (error) throw error;

      const total = data.length;
      const completed = data.filter(a => a.status === 'completed').length;
      const cancelled = data.filter(a => a.status === 'cancelled').length;
      const noShow = data.filter(a => a.status === 'no_show').length;
      const byStatus = {
        completed,
        cancelled,
        no_show: noShow,
        pending: total - completed - cancelled - noShow
      };

      return { total, byStatus, completionRate: (completed / total) * 100 };
    }
  });

  // Patient analytics
  const { data: patientData } = useQuery({
    queryKey: ['patient-analytics', dentistId, period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('dentist_id', dentistId)
        .gte('appointment_date', start.toISOString())
        .lte('appointment_date', end.toISOString());

      if (error) throw error;

      const uniquePatients = new Set(data.map(a => a.patient_id)).size;
      
      // Get new patients (first appointment in this period)
      const { data: allAppointments } = await supabase
        .from('appointments')
        .select('patient_id, appointment_date')
        .eq('dentist_id', dentistId)
        .order('appointment_date', { ascending: true });

      const newPatients = allAppointments?.filter(a => {
        const firstAppointment = new Date(a.appointment_date);
        return firstAppointment >= start && firstAppointment <= end;
      }).length || 0;

      return { total: uniquePatients, new: newPatients };
    }
  });

  const revenueChartData = Object.entries(revenueData?.byMethod || {}).map(([name, value]) => ({
    name,
    value
  }));

  const appointmentStatusData = Object.entries(appointmentData?.byStatus || {}).map(([name, value]) => ({
    name,
    value
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Business Analytics</h2>
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{revenueData?.total?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">For selected period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointmentData?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {appointmentData?.completionRate?.toFixed(1)}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Patients Seen</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patientData?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {patientData?.new || 0} new patients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Per Patient</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{((revenueData?.total || 0) / (patientData?.total || 1)).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Revenue per patient</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="patients">Patients</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {revenueChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appointment Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={appointmentStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Patient Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Total Unique Patients</p>
                    <p className="text-sm text-muted-foreground">In selected period</p>
                  </div>
                  <div className="text-2xl font-bold">{patientData?.total || 0}</div>
                </div>
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">New Patients</p>
                    <p className="text-sm text-muted-foreground">First visit in period</p>
                  </div>
                  <div className="text-2xl font-bold">{patientData?.new || 0}</div>
                </div>
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Returning Patients</p>
                    <p className="text-sm text-muted-foreground">Multiple visits</p>
                  </div>
                  <div className="text-2xl font-bold">
                    {(patientData?.total || 0) - (patientData?.new || 0)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
