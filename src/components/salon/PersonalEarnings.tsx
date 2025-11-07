/**
 * Personal Earnings - Type A (Solo Stylist)
 *
 * Simple earnings tracking for solo stylists
 * Features:
 * - Daily/weekly/monthly earnings
 * - Service revenue breakdown
 * - Product sales tracking
 * - Tips tracking
 * - No complex commission calculations
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBusinessContext } from '@/hooks/useBusinessContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, Package, Heart } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from 'date-fns';
import { ModernLoadingSpinner } from '@/components/enhanced/ModernLoadingSpinner';

interface EarningsSummary {
  servicesRevenue: number;
  productsRevenue: number;
  tips: number;
  totalEarnings: number;
  clientCount: number;
}

type PeriodType = 'week' | 'month';

export function PersonalEarnings() {
  const { businessId } = useBusinessContext();
  const [loading, setLoading] = useState(true);
  const [stylistId, setStylistId] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodType>('week');
  const [currentEarnings, setCurrentEarnings] = useState<EarningsSummary | null>(null);
  const [previousEarnings, setPreviousEarnings] = useState<EarningsSummary | null>(null);

  useEffect(() => {
    if (!businessId) return;
    loadEarnings();
  }, [businessId, period]);

  const loadEarnings = async () => {
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

      // Calculate date ranges
      const now = new Date();
      let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date;

      if (period === 'week') {
        currentStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
        currentEnd = endOfWeek(now, { weekStartsOn: 1 });
        previousStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        previousEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      } else {
        currentStart = startOfMonth(now);
        currentEnd = endOfMonth(now);
        previousStart = startOfMonth(subMonths(now, 1));
        previousEnd = endOfMonth(subMonths(now, 1));
      }

      // Fetch current period
      const current = await fetchPeriodEarnings(
        dentist.id,
        businessId,
        currentStart,
        currentEnd
      );
      setCurrentEarnings(current);

      // Fetch previous period for comparison
      const previous = await fetchPeriodEarnings(
        dentist.id,
        businessId,
        previousStart,
        previousEnd
      );
      setPreviousEarnings(previous);
    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPeriodEarnings = async (
    stylistId: string,
    businessId: string,
    startDate: Date,
    endDate: Date
  ): Promise<EarningsSummary> => {
    // Fetch completed appointments for services revenue
    const { data: appointments } = await supabase
      .from('appointments')
      .select(`
        id,
        business_services(price_cents)
      `)
      .eq('dentist_id', stylistId)
      .eq('business_id', businessId)
      .eq('status', 'completed')
      .gte('appointment_date', startDate.toISOString())
      .lte('appointment_date', endDate.toISOString());

    const servicesRevenue =
      appointments?.reduce((sum, apt) => {
        const service = Array.isArray(apt.business_services)
          ? apt.business_services[0]
          : apt.business_services;
        return sum + (service?.price_cents || 0);
      }, 0) || 0;
    const clientCount = appointments?.length || 0;

    // Fetch product sales
    const { data: productSales } = await supabase
      .from('product_sales')
      .select('price_cents')
      .eq('sold_by_stylist_id', stylistId)
      .eq('business_id', businessId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const productsRevenue =
      productSales?.reduce((sum, sale) => sum + (sale.price_cents || 0), 0) || 0;

    // Fetch tips
    const { data: tips } = await supabase
      .from('service_tips')
      .select('amount_cents')
      .eq('stylist_id', stylistId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const tipsTotal = tips?.reduce((sum, tip) => sum + (tip.amount_cents || 0), 0) || 0;

    return {
      servicesRevenue: servicesRevenue / 100,
      productsRevenue: productsRevenue / 100,
      tips: tipsTotal / 100,
      totalEarnings: (servicesRevenue + productsRevenue + tipsTotal) / 100,
      clientCount,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <ModernLoadingSpinner variant="overlay" size="lg" message="Loading earnings..." />
      </div>
    );
  }

  const percentageChange =
    previousEarnings && previousEarnings.totalEarnings > 0
      ? ((currentEarnings!.totalEarnings - previousEarnings.totalEarnings) /
          previousEarnings.totalEarnings) *
        100
      : 0;

  const isPositive = percentageChange >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Personal Earnings</h1>
          <p className="text-muted-foreground">Your revenue breakdown</p>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
          <TabsList>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Total Earnings Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardDescription>Total Earnings</CardDescription>
          <CardTitle className="text-5xl text-green-600">
            €{currentEarnings?.totalEarnings.toFixed(2) || '0.00'}
          </CardTitle>
          {previousEarnings && (
            <div className="flex items-center text-sm">
              <TrendingUp
                className={`mr-1 h-4 w-4 ${
                  isPositive ? 'text-green-600' : 'text-red-600 rotate-180'
                }`}
              />
              <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                {isPositive ? '+' : ''}
                {percentageChange.toFixed(1)}%
              </span>
              <span className="text-muted-foreground ml-1">
                vs last {period === 'week' ? 'week' : 'month'}
              </span>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Services Revenue */}
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center">
              <DollarSign className="mr-2 h-4 w-4" />
              Services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              €{currentEarnings?.servicesRevenue.toFixed(2) || '0.00'}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {currentEarnings?.clientCount || 0} clients
            </div>
          </CardContent>
        </Card>

        {/* Product Sales */}
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center">
              <Package className="mr-2 h-4 w-4" />
              Product Sales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              €{currentEarnings?.productsRevenue.toFixed(2) || '0.00'}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Retail products</div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center">
              <Heart className="mr-2 h-4 w-4" />
              Tips
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">€{currentEarnings?.tips.toFixed(2) || '0.00'}</div>
            <div className="text-sm text-muted-foreground mt-1">Client gratuity</div>
          </CardContent>
        </Card>
      </div>

      {/* Previous Period Comparison */}
      {previousEarnings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Last {period === 'week' ? 'Week' : 'Month'} Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="text-xl font-semibold">
                  €{previousEarnings.totalEarnings.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Services</div>
                <div className="text-xl font-semibold">
                  €{previousEarnings.servicesRevenue.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Products</div>
                <div className="text-xl font-semibold">
                  €{previousEarnings.productsRevenue.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Tips</div>
                <div className="text-xl font-semibold">€{previousEarnings.tips.toFixed(2)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Simple Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {currentEarnings && (
            <>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Average per client</span>
                <span className="font-semibold">
                  €
                  {currentEarnings.clientCount > 0
                    ? (currentEarnings.servicesRevenue / currentEarnings.clientCount).toFixed(2)
                    : '0.00'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Average tip per client</span>
                <span className="font-semibold">
                  €
                  {currentEarnings.clientCount > 0
                    ? (currentEarnings.tips / currentEarnings.clientCount).toFixed(2)
                    : '0.00'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Product sales per client</span>
                <span className="font-semibold">
                  €
                  {currentEarnings.clientCount > 0
                    ? (currentEarnings.productsRevenue / currentEarnings.clientCount).toFixed(2)
                    : '0.00'}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
