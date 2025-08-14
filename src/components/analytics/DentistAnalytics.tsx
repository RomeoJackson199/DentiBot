import { useState, useEffect, useMemo } from "react";
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
  Star,
  Mail,
  Share2,
  Download,
  Filter,
  UserX
} from "lucide-react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as DateRangeCalendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";
import { format, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, getHours, getDay, eachDayOfInterval } from "date-fns";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, LineChart, Line, PieChart, Pie, Legend, Cell } from "recharts";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";

interface DentistAnalyticsProps {
  dentistId: string;
  onOpenPatientsTab?: () => void;
  onOpenClinicalTab?: () => void;
  onOpenPaymentsTab?: () => void;
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

export const DentistAnalytics = ({ dentistId, onOpenPatientsTab, onOpenClinicalTab, onOpenPaymentsTab }: DentistAnalyticsProps) => {
  const [loading, setLoading] = useState(true);

  // Filters
  const [range, setRange] = useState<"today" | "week" | "month" | "last_month" | "custom">("month");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [selectedTreatment, setSelectedTreatment] = useState<string>("all");

  // Data sets
  const [appointments, setAppointments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<any[]>([]);

  // Insights
  const [insights, setInsights] = useState<string[]>([]);
  const [highNoShowPatients, setHighNoShowPatients] = useState<Array<{ id: string; name: string; count: number }>>([]);
  const [followUpsCount, setFollowUpsCount] = useState<number>(0);
  const [revenueOpportunities, setRevenueOpportunities] = useState<Array<{ id: string; name: string; reason: string }>>([]);

  // Helpers
  const formatCurrencyEuro = (cents: number) => `€${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const rangeLabel = (r: typeof range) => r === 'today' ? 'Today' : r === 'week' ? 'This Week' : r === 'month' ? 'This Month' : r === 'last_month' ? 'Last Month' : 'Custom';

  const getRangeDates = (r: typeof range, custom?: DateRange) => {
    const now = new Date();
    if (r === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      return { start, end };
    }
    if (r === 'week') {
      const start = startOfWeek(now, { weekStartsOn: 1 });
      const end = endOfWeek(now, { weekStartsOn: 1 });
      return { start, end };
    }
    if (r === 'last_month') {
      const start = startOfMonth(subMonths(now, 1));
      const end = endOfMonth(subMonths(now, 1));
      return { start, end };
    }
    if (r === 'custom' && custom?.from) {
      const start = new Date(custom.from.setHours(0, 0, 0, 0));
      const endDate = custom.to || custom.from;
      const end = new Date(new Date(endDate).setHours(23, 59, 59, 999));
      return { start, end };
    }
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    return { start, end };
  };

  const buildCSV = (rows: Array<Record<string, any>>) => {
    if (!rows.length) return '';
    const headers = Object.keys(rows[0]);
    const escape = (val: any) => {
      if (val == null) return '';
      const s = String(val).replace(/"/g, '""');
      return /[",
]/.test(s) ? `"${s}"` : s;
    };
    const lines = [headers.join(',')].concat(rows.map(r => headers.map(h => escape(r[h])).join(',')));
    return lines.join('\n');
  };

  const downloadCSV = (name: string, rows: Array<Record<string, any>>) => {
    const csv = buildCSV(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const { start, end } = useMemo(() => getRangeDates(range, customRange), [range, customRange?.from, customRange?.to]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        // Appointments in range for this dentist
        const { data: appts } = await supabase
          .from('appointments')
          .select('id, appointment_date, status, patient_id, reason, dentist_id')
          .eq('dentist_id', dentistId)
          .gte('appointment_date', start.toISOString())
          .lte('appointment_date', end.toISOString());

        // Payment requests in range for this dentist
        const { data: pay } = await supabase
          .from('payment_requests')
          .select('id, amount, status, paid_at, created_at, patient_id, dentist_id')
          .eq('dentist_id', dentistId)
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());

        // Treatment plans for follow-ups/opportunities (not strictly time-bound)
        const { data: plans } = await supabase
          .from('treatment_plans')
          .select('id, patient_id, status, estimated_cost, title, start_date, end_date')
          .eq('dentist_id', dentistId);

        setAppointments(appts || []);
        setPayments(pay || []);
        setTreatmentPlans(plans || []);

        // Build insights (respect treatment filter)
        const apptsBase = (appts || []);
        const apptsFiltered = selectedTreatment === 'all' ? apptsBase : apptsBase.filter(a => (a.reason || 'Other').trim() === selectedTreatment);
        const completed = apptsFiltered.filter(a => a.status === 'completed');
        const byHour: Record<number, number> = {};
        const byDow: Record<number, number> = {};
        for (const a of completed) {
          const d = new Date(a.appointment_date);
          const hour = getHours(d);
          byHour[hour] = (byHour[hour] || 0) + 1;
          const dow = getDay(d);
          byDow[dow] = (byDow[dow] || 0) + 1;
        }
        const topHour = Object.entries(byHour).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0];
        const peakStart = topHour ? parseInt(topHour, 10) : 10;
        const peakEnd = peakStart + 2;
        const topDow = Object.entries(byDow).sort((a,b) => Number(b[1]) - Number(a[1]))[0]?.[0];
        const dowLabel = topDow != null ? ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][Number(topDow)] : 'Weekdays';

        const cancelled = apptsFiltered.filter(a => a.status === 'cancelled');
        const noShowByPatient: Record<string, number> = {};
        for (const a of cancelled) noShowByPatient[a.patient_id] = (noShowByPatient[a.patient_id] || 0) + 1;
        const highNoShowEntries = Object.entries(noShowByPatient).filter(([, c]) => Number(c) >= 2);

        // Enrich patient names for high no-show list
        const ids = highNoShowEntries.map(([id]) => id);
        let enriched: Array<{ id: string; name: string; count: number }> = [];
        if (ids.length) {
          const { data: profs } = await supabase.from('profiles').select('id, first_name, last_name').in('id', ids);
          const nameMap = new Map((profs || []).map(p => [p.id, `${p.first_name} ${p.last_name}`.trim()]));
          enriched = highNoShowEntries.map(([id, count]) => ({ id, name: nameMap.get(id) || id, count: count as number }));
        }

        const followUps = (plans || []).filter(p => (p.status || '').toLowerCase() !== 'completed').length;
        const unpaid = (pay || []).filter(p => p.status !== 'paid').length;

        const newInsights: string[] = [];
        newInsights.push(`Most appointments happen between ${peakStart}:00–${peakEnd}:00 on ${dowLabel}.`);
        if (enriched.length > 0) newInsights.push(`${enriched.length} high no-show patients flagged.`);
        if (followUps > 0) newInsights.push(`${followUps} patients are due for follow-ups.`);
        if (unpaid > 0) newInsights.push(`${unpaid} unpaid invoices — follow up to capture revenue.`);
        setInsights(newInsights);
        setHighNoShowPatients(enriched.slice(0, 5));
        setFollowUpsCount(followUps);
        setRevenueOpportunities((plans || []).filter(p => (p.status || '').toLowerCase() !== 'completed').slice(0, 5).map(p => ({ id: p.id, name: p.patient_id, reason: p.title || 'Treatment plan' })));
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [dentistId, start.getTime(), end.getTime(), selectedTreatment]);

  // Derived metrics
  const revenueCents = useMemo(() => payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0), [payments]);
  const completedAppointments = useMemo(() => appointments.filter(a => a.status === 'completed'), [appointments]);
  const cancelledAppointments = useMemo(() => appointments.filter(a => a.status === 'cancelled'), [appointments]);

  // Retention calculation: patients in current period with a prior visit within 6 months before start
  const [retentionRate, setRetentionRate] = useState<number>(0);
  useEffect(() => {
    const calcRetention = async () => {
      const currentPatients = Array.from(new Set(completedAppointments.map(a => a.patient_id)));
      if (!currentPatients.length) { setRetentionRate(0); return; }
      const sixMonthsAgo = subMonths(start, 6);
      // Chunk IN query if many patients
      const chunkSize = 50;
      let priorCount = 0;
      for (let i = 0; i < currentPatients.length; i += chunkSize) {
        const chunk = currentPatients.slice(i, i + chunkSize);
        const { data: prior } = await supabase
          .from('appointments')
          .select('id, patient_id, appointment_date')
          .eq('dentist_id', dentistId)
          .in('patient_id', chunk)
          .gte('appointment_date', sixMonthsAgo.toISOString())
          .lt('appointment_date', start.toISOString());
        const priorIds = new Set((prior || []).map(p => p.patient_id));
        priorCount += chunk.filter(pid => priorIds.has(pid)).length;
      }
      setRetentionRate(Math.round((priorCount / currentPatients.length) * 100));
    };
    calcRetention();
  }, [dentistId, completedAppointments.length, start.getTime()]);

  // Outstanding payments
  const outstanding = useMemo(() => {
    const pending = payments.filter(p => p.status !== 'paid');
    const totalCents = pending.reduce((sum, p) => sum + (p.amount || 0), 0);
    const numPatients = new Set(pending.map(p => p.patient_id)).size;
    return { totalCents, numPatients };
  }, [payments]);

  // Treatment list derived from appointments reasons
  const availableTreatments = useMemo(() => {
    const reasons = Array.from(new Set(appointments.map(a => (a.reason || 'Other').trim())));
    return reasons.filter(Boolean);
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    if (selectedTreatment === 'all') return appointments;
    return appointments.filter(a => (a.reason || 'Other').trim() === selectedTreatment);
  }, [appointments, selectedTreatment]);

  // Trends
  const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  const revenueTrend = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of payments) {
      if (p.status !== 'paid') continue;
      const d = new Date(p.paid_at || p.created_at);
      if (d < start || d > end) continue;
      const key = dayKey(d);
      map[key] = (map[key] || 0) + (p.amount || 0);
    }
    const days = eachDayOfInterval({ start, end });
    return days.map(d => ({ date: format(d, 'MMM d'), value: Math.round((map[dayKey(d)] || 0) / 100) }));
  }, [payments, start.getTime(), end.getTime()]);

  const appointmentsTrend = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of completedAppointments) {
      const d = new Date(a.appointment_date);
      const key = dayKey(d);
      map[key] = (map[key] || 0) + 1;
    }
    const days = eachDayOfInterval({ start, end });
    return days.map(d => ({ date: format(d, 'MMM d'), value: map[dayKey(d)] || 0 }));
  }, [completedAppointments, start.getTime(), end.getTime()]);

  const treatmentPopularity = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of completedAppointments) {
      const key = (a.reason || 'Other').trim();
      map[key] = (map[key] || 0) + 1;
    }
    const entries = Object.entries(map).sort((a,b) => b[1]-a[1]);
    return entries.map(([name, count]) => ({ name, value: count }));
  }, [completedAppointments]);

  const retentionVsNew = useMemo(() => {
    const total = completedAppointments.length;
    const repeat = Math.round((retentionRate / 100) * (new Set(completedAppointments.map(a => a.patient_id)).size));
    const firstTime = Math.max(0, total - repeat);
    return [
      { name: 'Repeat', value: repeat },
      { name: 'New', value: firstTime }
    ];
  }, [completedAppointments.length, retentionRate]);

  const noShowHeatmap = useMemo(() => {
    // Build day(0-6) x hour(8..18)
    const grid: { day: number; hour: number; value: number }[] = [];
    const counts: Record<string, number> = {};
    for (const a of cancelledAppointments) {
      const d = new Date(a.appointment_date);
      const key = `${getDay(d)}-${getHours(d)}`;
      counts[key] = (counts[key] || 0) + 1;
    }
    for (let day = 0; day < 7; day++) {
      for (let hour = 8; hour <= 18; hour++) {
        const key = `${day}-${hour}`;
        grid.push({ day, hour, value: counts[key] || 0 });
      }
    }
    const max = grid.reduce((m, g) => Math.max(m, g.value), 0) || 1;
    return { grid, max };
  }, [cancelledAppointments.length]);

  // Deltas vs previous period
  const [deltaRevenuePct, setDeltaRevenuePct] = useState<number>(0);
  const [deltaApptsPct, setDeltaApptsPct] = useState<number>(0);
  const [deltaRetentionPct, setDeltaRetentionPct] = useState<number>(0);
  const [deltaOutstandingPct, setDeltaOutstandingPct] = useState<number>(0);
  useEffect(() => {
    const fetchPrevious = async () => {
      const lengthMs = end.getTime() - start.getTime() + 1;
      const prevEnd = new Date(start.getTime() - 1);
      const prevStart = new Date(prevEnd.getTime() - lengthMs + 1);

      const [{ data: prevPay }, { data: prevAppts }] = await Promise.all([
        supabase.from('payment_requests')
          .select('amount, status, paid_at, created_at')
          .eq('dentist_id', dentistId)
          .gte('created_at', prevStart.toISOString())
          .lte('created_at', prevEnd.toISOString()),
        supabase.from('appointments')
          .select('id, appointment_date, status, patient_id')
          .eq('dentist_id', dentistId)
          .gte('appointment_date', prevStart.toISOString())
          .lte('appointment_date', prevEnd.toISOString())
      ]);

      const prevRevenue = (prevPay || []).filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0);
      const prevApptsCompleted = (prevAppts || []).filter(a => a.status === 'completed').length;
      const prevOutstanding = (prevPay || []).filter(p => p.status !== 'paid').reduce((s, p) => s + (p.amount || 0), 0);

      const currentRevenue = revenueCents;
      const currentAppts = completedAppointments.length;
      const currentOutstanding = outstanding.totalCents;

      setDeltaRevenuePct(prevRevenue ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0);
      setDeltaApptsPct(prevApptsCompleted ? ((currentAppts - prevApptsCompleted) / prevApptsCompleted) * 100 : 0);
      setDeltaOutstandingPct(prevOutstanding ? ((currentOutstanding - prevOutstanding) / prevOutstanding) * 100 : 0);

      // Previous retention
      const prevPatients = Array.from(new Set((prevAppts || []).filter(a => a.status === 'completed').map(a => a.patient_id)));
      let prevRepeat = 0;
      if (prevPatients.length) {
        const sixMonthsBeforePrev = subMonths(prevStart, 6);
        const { data: priorPrev } = await supabase
          .from('appointments')
          .select('patient_id, appointment_date')
          .eq('dentist_id', dentistId)
          .in('patient_id', prevPatients)
          .gte('appointment_date', sixMonthsBeforePrev.toISOString())
          .lt('appointment_date', prevStart.toISOString());
        const priorPrevIds = new Set((priorPrev || []).map(p => p.patient_id));
        prevRepeat = prevPatients.filter(pid => priorPrevIds.has(pid)).length;
      }
      const currentPatients = new Set(completedAppointments.map(a => a.patient_id)).size;
      const prevRetention = prevPatients.length ? (prevRepeat / prevPatients.length) * 100 : 0;
      const currentRetention = currentPatients ? retentionRate : 0;
      setDeltaRetentionPct(prevRetention ? (currentRetention - prevRetention) : 0);
    };
    fetchPrevious();
  }, [dentistId, start.getTime(), end.getTime(), revenueCents, completedAppointments.length, outstanding.totalCents, retentionRate]);

  // Export & share
  const onExportPDF = () => window.print();
  const onExportCSV = () => {
    downloadCSV('appointments', filteredAppointments.map(a => ({
      id: a.id,
      date: a.appointment_date,
      status: a.status,
      patient_id: a.patient_id,
      reason: a.reason || ''
    })));
    downloadCSV('payments', payments.map(p => ({
      id: p.id,
      created_at: p.created_at,
      paid_at: p.paid_at || '',
      status: p.status,
      amount_eur: (p.amount || 0) / 100,
      patient_id: p.patient_id
    })));
  };
  const onEmailReport = () => {
    const subject = encodeURIComponent('Business Dashboard Report');
    const body = encodeURIComponent([
      `Range: ${rangeLabel(range)}`,
      `Total Revenue: ${formatCurrencyEuro(revenueCents)}`,
      `Appointments Completed: ${completedAppointments.length}`,
      `Patient Retention: ${retentionRate}%`,
      `Outstanding: ${formatCurrencyEuro(outstanding.totalCents)} (${outstanding.numPatients} patients)`,
    ].join('\n'));
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  if (loading) {
    return (
      <div className="space-y-4 px-4">
        <div className="h-10 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  // Colors for charts
  const pieColors = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#9333ea', '#0ea5e9', '#22c55e'];

  return (
    <div className="p-4 sm:p-6">
      {/* Sticky header & filters */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur border-b mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Business Dashboard</h2>
            <p className="text-xs text-muted-foreground">Instant overview of clinic performance</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={range} onValueChange={(v) => setRange(v as typeof range)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            {range === 'custom' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="whitespace-nowrap">
                    <Calendar className="w-4 h-4 mr-2" />
                    {customRange?.from && customRange?.to ? `${format(customRange.from, 'MMM d')} - ${format(customRange.to, 'MMM d')}` : 'Pick dates'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-2" align="end">
                  <DateRangeCalendar mode="range" selected={customRange} onSelect={setCustomRange} numberOfMonths={2} />
                </PopoverContent>
              </Popover>
            )}
            <Select value={selectedTreatment} onValueChange={(v) => setSelectedTreatment(v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Treatments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Treatments</SelectItem>
                {availableTreatments.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={onExportPDF}><Download className="w-4 h-4 mr-2" />PDF</Button>
            <Button variant="outline" onClick={onExportCSV}><Download className="w-4 h-4 mr-2" />CSV</Button>
            <Button variant="default" onClick={onEmailReport}><Share2 className="w-4 h-4 mr-2" />Email</Button>
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-4">
        <Card onClick={() => onOpenPaymentsTab?.()} className="cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue — {rangeLabel(range)}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{formatCurrencyEuro(revenueCents)}</div>
            <p className={`text-xs ${deltaRevenuePct >= 0 ? 'text-green-600' : 'text-red-600'}`}>{deltaRevenuePct >= 0 ? '+' : ''}{deltaRevenuePct.toFixed(1)}% vs last</p>
          </CardContent>
        </Card>

        <Card onClick={() => onOpenClinicalTab?.()} className="cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments Completed</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{completedAppointments.length}</div>
            <p className={`text-xs ${deltaApptsPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>{deltaApptsPct >= 0 ? '+' : ''}{deltaApptsPct.toFixed(1)}% vs last</p>
          </CardContent>
        </Card>

        <Card onClick={() => onOpenPatientsTab?.()} className="cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patient Retention Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{retentionRate}%</div>
            <p className={`text-xs ${deltaRetentionPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>{deltaRetentionPct >= 0 ? '+' : ''}{deltaRetentionPct.toFixed(1)}% vs last</p>
          </CardContent>
        </Card>

        <Card onClick={() => onOpenPatientsTab?.()} className="cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Payments</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{formatCurrencyEuro(outstanding.totalCents)} <span className="text-sm text-muted-foreground">• {outstanding.numPatients} patients</span></div>
            <p className={`text-xs ${deltaOutstandingPct >= 0 ? 'text-red-600' : 'text-green-600'}`}>{deltaOutstandingPct >= 0 ? '+' : ''}{deltaOutstandingPct.toFixed(1)}% vs last</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts - swipeable on mobile */}
      <Card className="mb-6">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Trends & Distributions</CardTitle>
        </CardHeader>
        <CardContent>
          <Carousel opts={{ align: 'start' }}>
            <CarouselContent>
              <CarouselItem>
                <div className="p-2">
                  <div className="text-sm font-medium mb-2">Revenue Trend</div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueTrend}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v) => [`€${Number(v).toLocaleString()}`, 'Revenue']} />
                        <Bar dataKey="value" fill="#2563eb" onClick={() => onOpenPaymentsTab?.()} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CarouselItem>

              <CarouselItem>
                <div className="p-2">
                  <div className="text-sm font-medium mb-2">Appointments Completed</div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={appointmentsTrend}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2} dot={false} onClick={() => onOpenClinicalTab?.()} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CarouselItem>

              <CarouselItem>
                <div className="p-2">
                  <div className="text-sm font-medium mb-2">Treatment Popularity</div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={treatmentPopularity} dataKey="value" nameKey="name" outerRadius={80} onClick={() => onOpenPatientsTab?.()}>
                          {treatmentPopularity.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                          ))}
                        </Pie>
                        <Legend />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CarouselItem>

              <CarouselItem>
                <div className="p-2">
                  <div className="text-sm font-medium mb-2">Retention vs New Patients</div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={retentionVsNew}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#9333ea" onClick={() => onOpenPatientsTab?.()} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CarouselItem>

              <CarouselItem>
                <div className="p-2">
                  <div className="text-sm font-medium mb-2">No-Show Heatmap</div>
                  <div className="h-48">
                    <div className="grid grid-cols-11 gap-1 text-[10px]">
                      <div></div>
                      {Array.from({ length: 11 }).map((_, i) => <div key={i} className="text-center">{8 + i}:00</div>)}
                      {Array.from({ length: 7 }).map((_, day) => (
                        <div key={day} className="contents">
                          <div className="text-right pr-1">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][day]}</div>
                          {Array.from({ length: 11 }).map((_, i) => {
                            const hour = 8 + i;
                            const cell = noShowHeatmap.grid.find(g => g.day === day && g.hour === hour);
                            const intensity = cell ? (cell.value / noShowHeatmap.max) : 0;
                            const bg = intensity === 0 ? 'bg-muted' : intensity < 0.34 ? 'bg-orange-100' : intensity < 0.67 ? 'bg-orange-300' : 'bg-orange-500';
                            return <div key={i} className={`h-6 rounded ${bg}`} onClick={() => onOpenClinicalTab?.()} />
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious className="-left-6" />
            <CarouselNext className="-right-6" />
          </Carousel>
        </CardContent>
      </Card>

      {/* Actionable insights */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Actionable Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {insights.map((text, idx) => (
              <li key={idx} className="flex items-start justify-between gap-3">
                <span className="text-sm">{text}</span>
                <div className="flex items-center gap-2">
                  {text.includes('no-show') && (
                    <Button size="sm" variant="outline" onClick={() => onOpenPatientsTab?.()}><Mail className="w-4 h-4 mr-1" />Contact</Button>
                  )}
                  {text.includes('unpaid') && (
                    <Button size="sm" variant="outline" onClick={() => onOpenPaymentsTab?.()}><DollarSign className="w-4 h-4 mr-1" />View</Button>
                  )}
                  {text.includes('follow-up') && (
                    <Button size="sm" variant="outline" onClick={() => onOpenPatientsTab?.()}><UserX className="w-4 h-4 mr-1" />See</Button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {/* High No-Show Patients */}
          {highNoShowPatients.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-medium mb-2">High No-Show Patients</div>
              <div className="space-y-2">
                {highNoShowPatients.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-sm p-2 rounded border">
                    <span>{p.name} — {p.count} no-shows</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => onOpenPatientsTab?.()}><Mail className="w-4 h-4 mr-1" />Contact</Button>
                      <Button size="sm" variant="destructive" onClick={() => onOpenClinicalTab?.()}>Block</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Follow-ups Needed */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm">Follow-Ups Needed</div>
            <Button size="sm" variant="outline" onClick={() => onOpenPatientsTab?.()}>
              See all ({followUpsCount})
            </Button>
          </div>

          {/* Revenue Opportunities */}
          {revenueOpportunities.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-medium mb-2">Revenue Opportunities</div>
              <div className="space-y-2">
                {revenueOpportunities.map(r => (
                  <div key={r.id} className="flex items-center justify-between text-sm p-2 rounded border">
                    <span>{r.name}: {r.reason}</span>
                    <Button size="sm" variant="outline" onClick={() => onOpenPaymentsTab?.()}>Invoice</Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};