/**
 * Network Leaderboard - Type C (Enterprise Multi-Location)
 *
 * Cross-location stylist rankings
 * Features:
 * - Top performers across all locations
 * - Rankings by revenue, clients, tips
 * - Filter by time period (week/month)
 * - Recognition and motivation tool
 * - Location badges for each stylist
 */

import { useState, useEffect } from 'react';
import { useBusinessContext } from '@/hooks/useBusinessContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Award, MapPin, DollarSign, Users, Heart } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ModernLoadingSpinner } from '@/components/enhanced/ModernLoadingSpinner';

interface LeaderboardEntry {
  stylistId: string;
  stylistName: string;
  locationName: string;
  totalRevenue: number;
  totalClients: number;
  totalTips: number;
  ranking: number;
}

type PeriodType = 'week' | 'month';

export function NetworkLeaderboard() {
  const { businessId } = useBusinessContext();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>('week');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (!businessId) return;
    loadLeaderboard();
  }, [businessId, period]);

  const loadLeaderboard = async () => {
    if (!businessId) return;
    setLoading(true);

    try {
      // Calculate date range
      const now = new Date();
      let startDate: Date, endDate: Date;

      if (period === 'week') {
        startDate = startOfWeek(now, { weekStartsOn: 1 }); // Monday
        endDate = endOfWeek(now, { weekStartsOn: 1 });
      } else {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
      }

      // Get leaderboard using database function
      const { data, error } = await supabase.rpc('get_network_leaderboard', {
        parent_business_id_param: businessId,
        start_date_param: format(startDate, 'yyyy-MM-dd'),
        end_date_param: format(endDate, 'yyyy-MM-dd'),
        limit_param: 20,
      });

      if (error) throw error;

      if (data) {
        const entries = data.map((entry: any) => ({
          stylistId: entry.stylist_id,
          stylistName: entry.stylist_name,
          locationName: entry.location_name,
          totalRevenue: (entry.total_revenue_cents || 0) / 100,
          totalClients: entry.total_clients || 0,
          totalTips: (entry.total_tips_cents || 0) / 100,
          ranking: entry.ranking,
        }));
        setLeaderboard(entries);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-600" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Award className="h-6 w-6 text-amber-700" />;
    return null;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-600">1st Place</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400">2nd Place</Badge>;
    if (rank === 3) return <Badge className="bg-amber-700">3rd Place</Badge>;
    return <Badge variant="outline">#{rank}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <ModernLoadingSpinner variant="gradient" size="lg" message="Loading leaderboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Network Leaderboard</h1>
          <p className="text-muted-foreground">Top performers across all locations</p>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
          <TabsList>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-4">
          {/* 2nd Place */}
          <Card className="border-2 border-gray-400/50">
            <CardHeader className="text-center pb-3">
              <div className="flex justify-center mb-2">
                <Medal className="h-12 w-12 text-gray-400" />
              </div>
              <CardTitle className="text-xl">{leaderboard[1].stylistName}</CardTitle>
              <CardDescription className="flex items-center justify-center">
                <MapPin className="mr-1 h-3 w-3" />
                {leaderboard[1].locationName}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-green-600">
                €{leaderboard[1].totalRevenue.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {leaderboard[1].totalClients} clients • €{leaderboard[1].totalTips.toFixed(2)} tips
              </div>
            </CardContent>
          </Card>

          {/* 1st Place */}
          <Card className="border-4 border-yellow-600/50 transform scale-105">
            <CardHeader className="text-center pb-3">
              <div className="flex justify-center mb-2">
                <Trophy className="h-16 w-16 text-yellow-600" />
              </div>
              <CardTitle className="text-2xl">{leaderboard[0].stylistName}</CardTitle>
              <CardDescription className="flex items-center justify-center">
                <MapPin className="mr-1 h-3 w-3" />
                {leaderboard[0].locationName}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-bold text-green-600">
                €{leaderboard[0].totalRevenue.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {leaderboard[0].totalClients} clients • €{leaderboard[0].totalTips.toFixed(2)} tips
              </div>
              <Badge className="mt-3 bg-yellow-600">🏆 Top Performer</Badge>
            </CardContent>
          </Card>

          {/* 3rd Place */}
          <Card className="border-2 border-amber-700/50">
            <CardHeader className="text-center pb-3">
              <div className="flex justify-center mb-2">
                <Award className="h-12 w-12 text-amber-700" />
              </div>
              <CardTitle className="text-xl">{leaderboard[2].stylistName}</CardTitle>
              <CardDescription className="flex items-center justify-center">
                <MapPin className="mr-1 h-3 w-3" />
                {leaderboard[2].locationName}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-green-600">
                €{leaderboard[2].totalRevenue.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {leaderboard[2].totalClients} clients • €{leaderboard[2].totalTips.toFixed(2)} tips
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Full Leaderboard Table */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Rankings</CardTitle>
          <CardDescription>All stylists ranked by revenue</CardDescription>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="mx-auto h-12 w-12 mb-3 opacity-50" />
              <p>No data available for this period</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry) => (
                <div
                  key={entry.stylistId}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    entry.ranking <= 3 ? 'bg-secondary/20' : 'bg-background'
                  }`}
                >
                  {/* Rank & Name */}
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 flex justify-center">
                      {getRankIcon(entry.ranking) || (
                        <span className="text-2xl font-bold text-muted-foreground">
                          {entry.ranking}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{entry.stylistName}</div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <MapPin className="mr-1 h-3 w-3" />
                        {entry.locationName}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <DollarSign className="mr-1 h-3 w-3" />
                        Revenue
                      </div>
                      <div className="text-xl font-bold text-green-600">
                        €{entry.totalRevenue.toFixed(2)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="mr-1 h-3 w-3" />
                        Clients
                      </div>
                      <div className="text-xl font-bold">{entry.totalClients}</div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Heart className="mr-1 h-3 w-3" />
                        Tips
                      </div>
                      <div className="text-xl font-bold">€{entry.totalTips.toFixed(2)}</div>
                    </div>

                    {/* Badge */}
                    <div className="w-24">
                      {getRankBadge(entry.ranking)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
