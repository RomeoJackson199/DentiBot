import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as DateRangeCalendar } from "@/components/ui/calendar";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Users,
  Calendar as LucideCalendar,
  AlertTriangle,
  Activity,
  Mail,
  UserX,
  FileWarning
} from "lucide-react";
import { getAnalytics } from "@/lib/mockApi";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { format, subDays } from "date-fns";
import type { DateRange } from "react-day-picker";

interface TrendPoint {
  date: string;
  revenue: number;
  appointments: number;
  noShowPercent: number; // 0..1
}

interface AnalyticsData {
  todaysRevenue: number;
  yesterdaysRevenue: number;
  todaysAppointments: { total: number; confirmed: number; cancelled: number };
  retention: { percent: number; target: number };
  noShow: { percent: number; target: number };
  unpaidInvoices: number;
  revenueTrend: Array<{ date: string; value: number }>;
  appointmentsTrend: Array<{ date: string; value: number }>;
  noShowTrend: Array<{ date: string; value: number }>;
  topServices: Array<{ name: string; count: number; revenue: number }>;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function generateTrend(days: number): TrendPoint[] {
  const today = new Date();
  const points: TrendPoint[] = [];
  let revenueBase = 1100;
  let apptBase = 18;
  let noShowBase = 0.06;

  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(today, i);
    const seasonal = Math.sin((days - i) / 3) * 120;
    const revenue = Math.round(revenueBase + seasonal + (Math.random() * 140 - 70));
    const appointments = Math.max(8, Math.round(apptBase + Math.sin((days - i) / 2) * 4 + (Math.random() * 6 - 3)));
    const noShowPercent = clamp(noShowBase + (Math.random() * 0.04 - 0.02), 0.01, 0.18);
    points.push({ date: format(d, days > 7 ? "MM/dd" : "EEE"), revenue, appointments, noShowPercent });
  }

  return points;
}

function calculateStatusColor(current: number, target: number, invert = false): { color: string; label: "On target" | "Warning" | "Urgent" } {
  // invert=true means lower is better (e.g., no-show)
  if (!invert) {
    if (current >= target) return { color: "text-green-600", label: "On target" };
    if (current >= target * 0.95) return { color: "text-yellow-600", label: "Warning" };
    return { color: "text-red-600", label: "Urgent" };
  } else {
    if (current <= target) return { color: "text-green-600", label: "On target" };
    if (current <= target + 2) return { color: "text-yellow-600", label: "Warning" };
    return { color: "text-red-600", label: "Urgent" };
  }
}

const rangeLabel = (range: "today" | "week" | "month" | "custom") =>
  range === "today" ? "Today" : range === "week" ? "This Week" : range === "month" ? "This Month" : "Custom";

const Analytics = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month" | "custom">("today");
  const [trendDays, setTrendDays] = useState<7 | 30>(7);
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Simulated base API call (we only use it to simulate latency)
        await getAnalytics();

        // Determine days window for KPIs (not the mini-trend toggle)
        const windowDays = timeRange === "today" ? 1 : timeRange === "week" ? 7 : timeRange === "month" ? 30 : (() => {
          const start = customRange?.from;
          const end = customRange?.to || customRange?.from;
          if (start && end) {
            const diffMs = Math.abs(end.getTime() - start.getTime());
            return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1);
          }
          return 7;
        })();

        // Generate enough points to compare with previous period
        const daysNeeded = Math.max(trendDays, windowDays * 2);
        const trend = generateTrend(daysNeeded);

        const chartSlice = trend.slice(-trendDays);
        const windowSlice = trend.slice(-windowDays);
        const prevSlice = trend.slice(-(windowDays * 2), -windowDays);

        const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

        const revenueSum = sum(windowSlice.map(p => p.revenue));
        const revenuePrevSum = prevSlice.length ? sum(prevSlice.map(p => p.revenue)) : (trend[trend.length - 2]?.revenue || trend[trend.length - 1]?.revenue || revenueSum);

        const apptSum = sum(windowSlice.map(p => p.appointments));
        const cancelledApprox = Math.round(apptSum * 0.08);
        const confirmedSum = Math.max(0, apptSum - cancelledApprox);

        const noShowAvg = windowSlice.length ? (sum(windowSlice.map(p => p.noShowPercent * 100)) / windowSlice.length) : (trend[trend.length - 1]?.noShowPercent || 0) * 100;

        const retentionTarget = 90;
        const retentionCurrent = clamp(85 + Math.round(Math.random() * 8), 78, 95);

        const noShowTarget = 5;

        const dataObj: AnalyticsData = {
          todaysRevenue: timeRange === "today" ? windowSlice[windowSlice.length - 1]?.revenue || 0 : revenueSum,
          yesterdaysRevenue: timeRange === "today" ? (trend[trend.length - 2]?.revenue || 0) : revenuePrevSum,
          todaysAppointments: timeRange === "today"
            ? (() => {
                const point = windowSlice[windowSlice.length - 1];
                if (!point) return { total: 0, confirmed: 0, cancelled: 0 };
                const cancelled = Math.round(point.appointments * 0.08);
                return { total: point.appointments, confirmed: point.appointments - cancelled, cancelled };
              })()
            : { total: apptSum, confirmed: confirmedSum, cancelled: cancelledApprox },
          retention: { percent: retentionCurrent, target: retentionTarget },
          noShow: { percent: Math.round(noShowAvg * 10) / 10, target: noShowTarget },
          unpaidInvoices: Math.random() > 0.5 ? Math.floor(Math.random() * 5) + 1 : 0,
          revenueTrend: chartSlice.map(p => ({ date: p.date, value: p.revenue })),
          appointmentsTrend: chartSlice.map(p => ({ date: p.date, value: p.appointments })),
          noShowTrend: chartSlice.map(p => ({ date: p.date, value: Math.round(p.noShowPercent * 1000) / 10 })),
          topServices: [
            { name: "Regular Checkup", count: 45, revenue: 13500 },
            { name: "Cleaning", count: 38, revenue: 11400 },
            { name: "Cavity Filling", count: 25, revenue: 12500 },
            { name: "Root Canal", count: 12, revenue: 9600 },
            { name: "Emergency", count: 10, revenue: 5000 },
          ],
        };

        const msgs: string[] = [];
        const revenueDelta = dataObj.yesterdaysRevenue ? ((dataObj.todaysRevenue - dataObj.yesterdaysRevenue) / dataObj.yesterdaysRevenue) * 100 : 0;
        if (Math.abs(revenueDelta) >= 5) {
          msgs.push(`${revenueDelta > 0 ? "Revenue up" : "Revenue down"} ${Math.abs(revenueDelta).toFixed(1)}% vs previous period.`);
        }

        if (dataObj.retention.percent < dataObj.retention.target) {
          msgs.push(`Retention is ${Math.max(0, dataObj.retention.target - dataObj.retention.percent)}% below target — send follow-up reminders.`);
        }

        if (dataObj.noShow.percent > dataObj.noShow.target) {
          msgs.push(`No-show rate at ${dataObj.noShow.percent.toFixed(1)}% (target ≤ ${dataObj.noShow.target}%) — consider reminder texts.`);
        }

        msgs.push(`Most cancellations are before 11 AM — adjust scheduling.`);

        const topService = dataObj.topServices.reduce((a, b) => (a.revenue > b.revenue ? a : b));
        msgs.push(`${topService.name} is a top revenue driver ${timeRange === "today" ? "today" : timeRange === "week" ? "this week" : timeRange === "month" ? "this month" : "in this range"}.`);

        setData(dataObj);
        setInsights(msgs.slice(0, 4));
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange, trendDays, customRange?.from, customRange?.to]);

  const revenueChange = useMemo(() => {
    if (!data) return { pct: 0, up: true };
    const pct = data.yesterdaysRevenue ? ((data.todaysRevenue - data.yesterdaysRevenue) / data.yesterdaysRevenue) * 100 : 0;
    return { pct, up: pct >= 0 };
  }, [data]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-40 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">No analytics data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const retentionStatus = calculateStatusColor(data.retention.percent, data.retention.target, false);
  const noShowStatus = calculateStatusColor(data.noShow.percent, data.noShow.target, true);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground text-sm">Key performance and actions at a glance</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          {timeRange === "custom" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="whitespace-nowrap">
                  <LucideCalendar className="w-4 h-4 mr-2" />
                  {customRange?.from && customRange?.to
                    ? `${format(customRange.from, "MMM d")} - ${format(customRange.to, "MMM d")}`
                    : "Pick dates"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-2" align="end">
                <DateRangeCalendar
                  mode="range"
                  selected={customRange}
                  onSelect={setCustomRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}

          <Button variant="outline">
            <Activity className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Top Priority KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-4">
        {/* Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue — {rangeLabel(timeRange)}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">€{data.todaysRevenue.toLocaleString()}</div>
            <p className={`text-xs flex items-center gap-1 ${revenueChange.up ? "text-green-600" : "text-red-600"}`}>
              {revenueChange.up ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {Math.abs(revenueChange.pct).toFixed(1)}% vs previous
            </p>
          </CardContent>
        </Card>

        {/* Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments — {rangeLabel(timeRange)}</CardTitle>
            <LucideCalendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{data.todaysAppointments.total}</div>
            <p className="text-xs text-muted-foreground">
              {data.todaysAppointments.confirmed} confirmed • {data.todaysAppointments.cancelled} cancelled
            </p>
          </CardContent>
        </Card>

        {/* Patient Retention */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patient Retention</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-xl sm:text-2xl font-bold ${retentionStatus.color}`}>{data.retention.percent}%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              Target {data.retention.target}%
              <Badge variant={retentionStatus.label === "On target" ? "default" : retentionStatus.label === "Warning" ? "secondary" : "destructive"}>{retentionStatus.label}</Badge>
            </p>
          </CardContent>
        </Card>

        {/* No-Show Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No-Show Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-xl sm:text-2xl font-bold ${noShowStatus.color}`}>{data.noShow.percent.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              Target ≤ {data.noShow.target}%
              <Badge variant={noShowStatus.label === "On target" ? "default" : noShowStatus.label === "Warning" ? "secondary" : "destructive"}>{noShowStatus.label}</Badge>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Smart Insights */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Smart Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2">
            {insights.map((item, idx) => (
              <li key={idx} className="text-sm">{item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Trend Charts (Swipeable) */}
      <Card className="mb-6">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Trends</CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant={trendDays === 7 ? "default" : "outline"} onClick={() => setTrendDays(7)}>7d</Button>
            <Button size="sm" variant={trendDays === 30 ? "default" : "outline"} onClick={() => setTrendDays(30)}>30d</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Carousel opts={{ align: "start" }}>
            <CarouselContent>
              {/* Revenue trend */}
              <CarouselItem>
                <div className="p-2">
                  <div className="text-sm font-medium mb-2">Revenue</div>
                  <div className="h-40 sm:h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.revenueTrend} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} width={40} />
                        <Tooltip formatter={(value) => [`€${(value as number).toLocaleString()}`, "Revenue"]} />
                        <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CarouselItem>

              {/* Appointment volume */}
              <CarouselItem>
                <div className="p-2">
                  <div className="text-sm font-medium mb-2">Appointment Volume</div>
                  <div className="h-40 sm:h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.appointmentsTrend} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} width={30} />
                        <Tooltip formatter={(value) => [String(value), "Appointments"]} />
                        <Line type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CarouselItem>

              {/* No-show rate */}
              <CarouselItem>
                <div className="p-2">
                  <div className="text-sm font-medium mb-2">No-Show Rate</div>
                  <div className="h-40 sm:h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.noShowTrend} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} width={40} domain={[0, 20]} />
                        <Tooltip formatter={(value) => [`${value}%`, "No-Show"]} />
                        <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious className="-left-6" />
            <CarouselNext className="-right-6" />
          </Carousel>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {data.noShow.percent > data.noShow.target && (
              <Button variant="destructive">
                <Mail className="w-4 h-4 mr-2" />
                Send Reminders
              </Button>
            )}
            {data.retention.percent < data.retention.target && (
              <Button variant="outline">
                <UserX className="w-4 h-4 mr-2" />
                View Lost Patients
              </Button>
            )}
            {data.unpaidInvoices > 0 && (
              <Button>
                <FileWarning className="w-4 h-4 mr-2" />
                View Unpaid ({data.unpaidInvoices})
              </Button>
            )}
            {data.noShow.percent <= data.noShow.target && data.retention.percent >= data.retention.target && data.unpaidInvoices === 0 && (
              <p className="text-sm text-muted-foreground">All metrics are on target.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
