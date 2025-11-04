import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useBusinessContext } from '@/hooks/useBusinessContext';
import { DollarSign, TrendingUp, Users, Award } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';

interface StylistEarnings {
  stylistId: string;
  stylistName: string;
  stylistLevel: string;
  profilePhoto: string | null;
  servicesRevenue: number;
  servicesCommission: number;
  productsRevenue: number;
  productsCommission: number;
  tips: number;
  totalEarnings: number;
  clientCount: number;
}

interface CommissionCalculatorProps {
  weekOffset?: number; // 0 = this week, -1 = last week, etc.
}

export function CommissionCalculator({ weekOffset = 0 }: CommissionCalculatorProps) {
  const { businessId } = useBusinessContext();
  const [earnings, setEarnings] = useState<StylistEarnings[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [weekEnd, setWeekEnd] = useState<Date>(endOfWeek(new Date(), { weekStartsOn: 1 }));

  useEffect(() => {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + weekOffset * 7);
    setWeekStart(startOfWeek(baseDate, { weekStartsOn: 1 }));
    setWeekEnd(endOfWeek(baseDate, { weekStartsOn: 1 }));
  }, [weekOffset]);

  useEffect(() => {
    if (!businessId) return;
    loadEarnings();
  }, [businessId, weekStart, weekEnd]);

  const loadEarnings = async () => {
    if (!businessId) return;

    setLoading(true);

    try {
      // Get all stylists
      const { data: membersData } = await supabase
        .from('business_members')
        .select('profile_id')
        .eq('business_id', businessId);

      if (!membersData) {
        setEarnings([]);
        setLoading(false);
        return;
      }

      const { data: stylistsData } = await supabase
        .from('dentists')
        .select(`
          id,
          stylist_level,
          profiles:profile_id (
            first_name,
            last_name,
            profile_photo_url
          )
        `)
        .in('profile_id', membersData.map((m) => m.profile_id))
        .eq('is_active', true);

      if (!stylistsData) {
        setEarnings([]);
        setLoading(false);
        return;
      }

      // Get commission rates
      const { data: commissionRatesData } = await supabase
        .from('commission_rates')
        .select('*')
        .eq('business_id', businessId);

      const commissionRates = new Map(
        commissionRatesData?.map((r) => [
          r.stylist_level,
          {
            service: r.service_commission_percent / 100,
            product: r.product_commission_percent / 100,
          },
        ]) || []
      );

      // For each stylist, calculate earnings
      const earningsPromises = stylistsData.map(async (stylist) => {
        // Get services revenue
        const { data: appointmentsData } = await supabase
          .from('appointments')
          .select(`
            id,
            business_services(price_cents)
          `)
          .eq('dentist_id', stylist.id)
          .eq('business_id', businessId)
          .gte('appointment_date', weekStart.toISOString())
          .lte('appointment_date', weekEnd.toISOString())
          .eq('status', 'completed');

        const servicesRevenue =
          appointmentsData?.reduce(
            (sum, appt) => sum + (appt.business_services?.price_cents || 0),
            0
          ) / 100 || 0;

        const clientCount = appointmentsData?.length || 0;

        // Get product sales
        const { data: productSalesData } = await supabase
          .from('product_sales')
          .select('price_cents, quantity')
          .eq('sold_by_stylist_id', stylist.id)
          .eq('business_id', businessId)
          .gte('created_at', weekStart.toISOString())
          .lte('created_at', weekEnd.toISOString());

        const productsRevenue =
          productSalesData?.reduce((sum, sale) => sum + sale.price_cents * sale.quantity, 0) /
            100 || 0;

        // Get tips
        const { data: tipsData } = await supabase
          .from('service_tips')
          .select('amount_cents')
          .eq('stylist_id', stylist.id)
          .eq('business_id', businessId)
          .gte('created_at', weekStart.toISOString())
          .lte('created_at', weekEnd.toISOString());

        const tips = tipsData?.reduce((sum, tip) => sum + tip.amount_cents, 0) / 100 || 0;

        // Calculate commissions
        const rates = commissionRates.get(stylist.stylist_level) || { service: 0.45, product: 0.1 };
        const servicesCommission = servicesRevenue * rates.service;
        const productsCommission = productsRevenue * rates.product;
        const totalEarnings = servicesCommission + productsCommission + tips;

        return {
          stylistId: stylist.id,
          stylistName: `${stylist.profiles.first_name} ${stylist.profiles.last_name}`,
          stylistLevel: stylist.stylist_level || 'stylist',
          profilePhoto: stylist.profiles.profile_photo_url,
          servicesRevenue,
          servicesCommission,
          productsRevenue,
          productsCommission,
          tips,
          totalEarnings,
          clientCount,
        };
      });

      const earningsData = await Promise.all(earningsPromises);

      // Sort by total earnings descending
      earningsData.sort((a, b) => b.totalEarnings - a.totalEarnings);

      setEarnings(earningsData);
    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    const colors = {
      junior: 'bg-blue-100 text-blue-800',
      stylist: 'bg-purple-100 text-purple-800',
      senior: 'bg-orange-100 text-orange-800',
      master: 'bg-yellow-100 text-yellow-800',
    };
    return colors[level as keyof typeof colors] || colors.stylist;
  };

  const totalNetworkEarnings = earnings.reduce((sum, e) => sum + e.totalEarnings, 0);
  const totalClients = earnings.reduce((sum, e) => sum + e.clientCount, 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              💰 Team Earnings
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Paid Out</p>
            <p className="text-3xl font-bold">€{totalNetworkEarnings.toFixed(2)}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Total Clients</p>
            <p className="text-2xl font-bold">{totalClients}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg per Stylist</p>
            <p className="text-2xl font-bold">
              €{earnings.length > 0 ? (totalNetworkEarnings / earnings.length).toFixed(0) : 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Top Earner</p>
            <p className="text-2xl font-bold">
              {earnings[0] ? `€${earnings[0].totalEarnings.toFixed(0)}` : '-'}
            </p>
          </div>
        </div>

        {/* Individual Stylist Earnings */}
        <div className="space-y-4">
          {earnings.map((stylist, index) => (
            <Card key={stylist.stylistId} className="overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-4 mb-4">
                  {/* Rank Badge */}
                  {index < 3 && (
                    <div className="flex-shrink-0">
                      {index === 0 && <Award className="h-8 w-8 text-yellow-500" />}
                      {index === 1 && <Award className="h-7 w-7 text-gray-400" />}
                      {index === 2 && <Award className="h-6 w-6 text-orange-600" />}
                    </div>
                  )}

                  {/* Profile Photo */}
                  {stylist.profilePhoto ? (
                    <img
                      src={stylist.profilePhoto}
                      className="w-12 h-12 rounded-full object-cover"
                      alt={stylist.stylistName}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {stylist.stylistName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                  )}

                  {/* Name & Level */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg truncate">{stylist.stylistName}</h3>
                      <Badge className={getLevelColor(stylist.stylistLevel)} variant="outline">
                        {stylist.stylistLevel}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {stylist.clientCount} clients
                      </span>
                    </div>
                  </div>

                  {/* Total Earnings */}
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Earnings</p>
                    <p className="text-2xl font-bold text-primary">
                      €{stylist.totalEarnings.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t text-sm">
                  <div>
                    <p className="text-muted-foreground">Services</p>
                    <p className="font-semibold">€{stylist.servicesRevenue.toFixed(2)}</p>
                    <p className="text-xs text-green-600">
                      +€{stylist.servicesCommission.toFixed(2)} commission
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Products</p>
                    <p className="font-semibold">€{stylist.productsRevenue.toFixed(2)}</p>
                    <p className="text-xs text-green-600">
                      +€{stylist.productsCommission.toFixed(2)} commission
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tips</p>
                    <p className="font-semibold">€{stylist.tips.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">100% to stylist</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Export Button */}
        <Button variant="outline" className="w-full">
          <DollarSign className="h-4 w-4 mr-2" />
          Export for Payroll
        </Button>
      </CardContent>
    </Card>
  );
}
