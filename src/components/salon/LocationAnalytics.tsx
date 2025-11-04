/**
 * Location Analytics - Type C (Enterprise Multi-Location)
 *
 * Compare performance across locations
 * Features:
 * - Side-by-side location comparison
 * - Filter by time period (week/month/quarter)
 * - Key metrics: revenue, clients, stylists, efficiency
 * - Identify underperforming locations
 * - Growth trends
 */

import { useState, useEffect } from 'react';
import { useBusinessContext } from '@/hooks/useBusinessContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Building2 } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ModernLoadingSpinner } from '@/components/enhanced/ModernLoadingSpinner';

interface LocationPerformance {
  locationId: string;
  locationName: string;
  totalRevenue: number;
  totalClients: number;
  stylistCount: number;
  avgRevenuePerClient: number;
  avgRevenuePerStylist: number;
}

type PeriodType = 'week' | 'month' | 'quarter';

export function LocationAnalytics() {
  const { businessId } = useBusinessContext();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>('month');
  const [locations, setLocations] = useState<LocationPerformance[]>([]);

  useEffect(() => {
    if (!businessId) return;
    loadAnalytics();
  }, [businessId, period]);

  const loadAnalytics = async () => {
    if (!businessId) return;
    setLoading(true);

    try {
      // Calculate date range
      const now = new Date();
      let startDate: Date, endDate: Date;

      if (period === 'week') {
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
      } else if (period === 'month') {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
      } else {
        // quarter
        startDate = subMonths(now, 3);
        endDate = now;
      }

      // Get location comparison using database function
      const { data, error } = await supabase.rpc('compare_location_performance', {
        parent_business_id_param: businessId,
        start_date_param: format(startDate, 'yyyy-MM-dd'),
        end_date_param: format(endDate, 'yyyy-MM-dd'),
      });

      if (error) throw error;

      if (data) {
        const performances = data.map((loc: any) => ({
          locationId: loc.location_id,
          locationName: loc.location_name,
          totalRevenue: (loc.total_revenue_cents || 0) / 100,
          totalClients: loc.total_clients || 0,
          stylistCount: loc.stylist_count || 0,
          avgRevenuePerClient: (loc.avg_revenue_per_client_cents || 0) / 100,
          avgRevenuePerStylist: (loc.avg_revenue_per_stylist_cents || 0) / 100,
        }));
        setLocations(performances);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIndicator = (value: number, threshold: number) => {
    if (value > threshold) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    }
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const getPerformanceBadge = (revenue: number, avgRevenue: number) => {
    if (revenue >= avgRevenue * 1.2) {
      return <Badge className="bg-green-600">High Performer</Badge>;
    } else if (revenue >= avgRevenue * 0.8) {
      return <Badge variant="secondary">Average</Badge>;
    } else {
      return <Badge variant="destructive">Needs Attention</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <ModernLoadingSpinner variant="overlay" size="lg" message="Loading analytics..." />
      </div>
    );
  }

  const totalRevenue = locations.reduce((sum, loc) => sum + loc.totalRevenue, 0);
  const avgRevenue = locations.length > 0 ? totalRevenue / locations.length : 0;
  const totalClients = locations.reduce((sum, loc) => sum + loc.totalClients, 0);
  const totalStylists = locations.reduce((sum, loc) => sum + loc.stylistCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Location Analytics</h1>
          <p className="text-muted-foreground">Compare performance across your network</p>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
          <TabsList>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
            <TabsTrigger value="quarter">Quarter</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Network Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Network Revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">€{totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Average Per Location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">€{avgRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Clients Served</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalClients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Stylists</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalStylists}</div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Location Comparison</CardTitle>
          <CardDescription>Detailed performance metrics by location</CardDescription>
        </CardHeader>
        <CardContent>
          {locations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="mx-auto h-12 w-12 mb-3 opacity-50" />
              <p>No location data available</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Clients</TableHead>
                  <TableHead className="text-right">Stylists</TableHead>
                  <TableHead className="text-right">Avg/Client</TableHead>
                  <TableHead className="text-right">Avg/Stylist</TableHead>
                  <TableHead className="text-center">Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((location) => (
                  <TableRow key={location.locationId}>
                    <TableCell className="font-semibold">{location.locationName}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <span className="font-semibold text-green-600">
                          €{location.totalRevenue.toFixed(2)}
                        </span>
                        {getTrendIndicator(location.totalRevenue, avgRevenue)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {location.totalClients}
                    </TableCell>
                    <TableCell className="text-right">{location.stylistCount}</TableCell>
                    <TableCell className="text-right">
                      €{location.avgRevenuePerClient.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      €{location.avgRevenuePerStylist.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getPerformanceBadge(location.totalRevenue, avgRevenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {locations.length > 0 && (
              <>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">Highest Revenue Location</span>
                  <span className="font-semibold">
                    {locations[0]?.locationName} (€{locations[0]?.totalRevenue.toFixed(2)})
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">Most Efficient (Revenue/Stylist)</span>
                  <span className="font-semibold">
                    {
                      [...locations].sort(
                        (a, b) => b.avgRevenuePerStylist - a.avgRevenuePerStylist
                      )[0]?.locationName
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Best Client Value (Revenue/Client)</span>
                  <span className="font-semibold">
                    {
                      [...locations].sort(
                        (a, b) => b.avgRevenuePerClient - a.avgRevenuePerClient
                      )[0]?.locationName
                    }
                  </span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
