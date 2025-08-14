import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign, 
  Activity,
  Clock,
  Star,
  AlertTriangle
} from "lucide-react";
import { getAnalytics } from "@/lib/mockApi";

interface AnalyticsData {
  totalVisits: number;
  streak: number;
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    upcoming: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
  };
  patients: {
    total: number;
    newThisMonth: number;
    returning: number;
  };
  satisfaction: {
    averageRating: number;
    totalReviews: number;
  };
  monthlyData: Array<{
    month: string;
    appointments: number;
    revenue: number;
    patients: number;
  }>;
  topServices: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
}

const Analytics = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState("30");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await getAnalytics();
        if (response.data) {
          // Mock comprehensive data
          const mockData: AnalyticsData = {
            totalVisits: response.data.totalVisits,
            streak: response.data.streak,
            appointments: {
              total: 156,
              completed: 142,
              cancelled: 8,
              upcoming: 6
            },
            revenue: {
              total: 45230,
              thisMonth: 8900,
              lastMonth: 8200
            },
            patients: {
              total: 89,
              newThisMonth: 12,
              returning: 77
            },
            satisfaction: {
              averageRating: 4.8,
              totalReviews: 67
            },
            monthlyData: [
              { month: "Jan", appointments: 45, revenue: 7200, patients: 23 },
              { month: "Feb", appointments: 52, revenue: 8300, patients: 28 },
              { month: "Mar", appointments: 48, revenue: 7800, patients: 25 },
              { month: "Apr", appointments: 61, revenue: 9500, patients: 32 },
              { month: "May", appointments: 55, revenue: 8800, patients: 29 },
              { month: "Jun", appointments: 58, revenue: 9200, patients: 31 }
            ],
            topServices: [
              { name: "Regular Checkup", count: 45, revenue: 13500 },
              { name: "Cleaning", count: 38, revenue: 11400 },
              { name: "Cavity Filling", count: 25, revenue: 12500 },
              { name: "Root Canal", count: 8, revenue: 6400 },
              { name: "Emergency", count: 12, revenue: 4800 }
            ]
          };
          setData(mockData);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track your practice performance and patient insights
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Activity className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{data.revenue.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{((data.revenue.thisMonth - data.revenue.lastMonth) / data.revenue.lastMonth * 100).toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.patients.total}</div>
            <p className="text-xs text-muted-foreground">
              +{data.patients.newThisMonth} new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.appointments.total}</div>
            <p className="text-xs text-muted-foreground">
              {data.appointments.completed} completed, {data.appointments.upcoming} upcoming
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.satisfaction.averageRating}/5</div>
            <p className="text-xs text-muted-foreground">
              Based on {data.satisfaction.totalReviews} reviews
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`€${value}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Appointments by Service */}
        <Card>
          <CardHeader>
            <CardTitle>Top Services</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.topServices}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [value, 'Count']} />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Appointment Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Completed</span>
              <Badge variant="default">{data.appointments.completed}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Upcoming</span>
              <Badge variant="secondary">{data.appointments.upcoming}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Cancelled</span>
              <Badge variant="destructive">{data.appointments.cancelled}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Growth Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Revenue Growth</span>
              <Badge variant="default">
                +{((data.revenue.thisMonth - data.revenue.lastMonth) / data.revenue.lastMonth * 100).toFixed(1)}%
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>New Patients</span>
              <Badge variant="secondary">+{data.patients.newThisMonth}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Returning Patients</span>
              <Badge variant="outline">{data.patients.returning}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Alerts & Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>High demand:</strong> Consider adding more appointment slots
              </p>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Great reviews:</strong> Patient satisfaction is above average
              </p>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Revenue up:</strong> 8.5% increase from last month
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
