/**
 * Network Dashboard - Type C (Enterprise Multi-Location)
 *
 * Corporate overview of all salon locations
 * Features:
 * - Network-wide revenue and stats
 * - Location performance cards
 * - Top performing location highlight
 * - Quick access to individual locations
 * - Network goals progress
 */

import { useState, useEffect } from 'react';
import { useBusinessContext } from '@/hooks/useBusinessContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  MapPin,
  Star,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ModernLoadingSpinner } from '@/components/enhanced/ModernLoadingSpinner';
import { useNavigate } from 'react-router-dom';

interface NetworkSummary {
  totalLocations: number;
  activeLocations: number;
  totalStylists: number;
  totalRevenue: number;
  totalClients: number;
  totalTips: number;
  topLocationId: string | null;
  topLocationName: string | null;
  topLocationRevenue: number;
}

interface LocationCard {
  id: string;
  name: string;
  city: string;
  managerName: string | null;
  stylistCount: number;
  todayRevenue: number;
  todayClients: number;
  isActive: boolean;
}

export function NetworkDashboard() {
  const { businessId } = useBusinessContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<NetworkSummary | null>(null);
  const [locations, setLocations] = useState<LocationCard[]>([]);

  useEffect(() => {
    if (!businessId) return;
    loadNetworkData();

    // Refresh every 2 minutes
    const interval = setInterval(loadNetworkData, 120000);
    return () => clearInterval(interval);
  }, [businessId]);

  const loadNetworkData = async () => {
    if (!businessId) return;
    setLoading(true);

    try {
      // Get network summary using database function
      const { data: summaryData } = await supabase.rpc('get_network_summary', {
        parent_business_id_param: businessId,
        date_param: format(new Date(), 'yyyy-MM-dd'),
      });

      if (summaryData && summaryData.length > 0) {
        const s = summaryData[0];
        setSummary({
          totalLocations: s.total_locations || 0,
          activeLocations: s.active_locations || 0,
          totalStylists: s.total_stylists || 0,
          totalRevenue: (s.total_revenue_cents || 0) / 100,
          totalClients: s.total_clients || 0,
          totalTips: (s.total_tips_cents || 0) / 100,
          topLocationId: s.top_location_id,
          topLocationName: s.top_location_name,
          topLocationRevenue: (s.top_location_revenue_cents || 0) / 100,
        });
      }

      // Get individual location cards
      const { data: locationsData } = await supabase
        .from('locations')
        .select(`
          id,
          name,
          city,
          is_active,
          manager:manager_id(first_name, last_name)
        `)
        .eq('parent_business_id', businessId)
        .order('name');

      if (locationsData) {
        // Fetch today's stats for each location
        const locationCards = await Promise.all(
          locationsData.map(async (loc) => {
            const { data: dentists } = await supabase
              .from('dentists')
              .select('id')
              .eq('location_id', loc.id)
              .eq('is_active', true);

            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);

            const { data: appointments } = await supabase
              .from('appointments')
              .select(`
                id,
                business_services(price_cents)
              `)
              .eq('location_id', loc.id)
              .eq('status', 'completed')
              .gte('appointment_date', startOfDay.toISOString())
              .lte('appointment_date', endOfDay.toISOString());

            const revenue = appointments?.reduce(
              (sum, apt) => {
                const service = Array.isArray(apt.business_services)
                  ? apt.business_services[0]
                  : apt.business_services;
                return sum + (service?.price_cents || 0);
              },
              0
            ) || 0;

            const manager = Array.isArray(loc.manager) ? loc.manager[0] : loc.manager;
            const managerName = manager
              ? `${manager.first_name || ''} ${manager.last_name || ''}`
              : null;

            return {
              id: loc.id,
              name: loc.name,
              city: loc.city || '',
              managerName,
              stylistCount: dentists?.length || 0,
              todayRevenue: revenue / 100,
              todayClients: appointments?.length || 0,
              isActive: loc.is_active || false,
            };
          })
        );

        setLocations(locationCards);
      }
    } catch (error) {
      console.error('Error loading network data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <ModernLoadingSpinner variant="overlay" size="lg" message="Loading network overview..." />
      </div>
    );
  }

  const totalEarnings = (summary?.totalRevenue || 0) + (summary?.totalTips || 0);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Network Overview</h1>
          <p className="text-muted-foreground">{format(new Date(), 'EEEE, MMMM d')}</p>
        </div>
        <Badge variant="outline" className="text-lg py-2 px-4">
          <Building2 className="mr-2 h-4 w-4" />
          {summary?.activeLocations || 0} locations
        </Badge>
      </div>

      {/* Network-Wide Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center">
              <DollarSign className="mr-2 h-4 w-4" />
              Network Revenue (Today)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              €{totalEarnings.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Services €{summary?.totalRevenue.toFixed(2) || '0.00'} + Tips €
              {summary?.totalTips.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>

        {/* Total Clients */}
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Total Clients (Today)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.totalClients || 0}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Across all locations
            </div>
          </CardContent>
        </Card>

        {/* Total Stylists */}
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Network Stylists
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.totalStylists || 0}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Active team members
            </div>
          </CardContent>
        </Card>

        {/* Locations */}
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center">
              <Building2 className="mr-2 h-4 w-4" />
              Salon Locations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.activeLocations || 0}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {summary?.totalLocations || 0} total
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Location */}
      {summary?.topLocationName && (
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Star className="mr-2 h-5 w-5 text-yellow-600" />
              Today's Top Performer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-semibold">{summary.topLocationName}</div>
                <div className="text-lg text-green-600 mt-1">
                  €{summary.topLocationRevenue.toFixed(2)}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/location/${summary.topLocationId}`)}
              >
                View Details
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location Cards */}
      <div>
        <h2 className="text-2xl font-bold mb-4">All Locations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((location) => (
            <Card
              key={location.id}
              className={`cursor-pointer hover:shadow-lg transition-shadow ${
                !location.isActive ? 'opacity-60' : ''
              }`}
              onClick={() => navigate(`/location/${location.id}`)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <MapPin className="mr-2 h-5 w-5" />
                    {location.name}
                  </span>
                  {!location.isActive && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </CardTitle>
                <CardDescription>{location.city}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Manager */}
                  {location.managerName && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Manager:</span>
                      <span className="font-medium">{location.managerName}</span>
                    </div>
                  )}

                  {/* Stylists */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Stylists:</span>
                    <span className="font-medium">{location.stylistCount}</span>
                  </div>

                  {/* Today's Stats */}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Today's Revenue</div>
                        <div className="text-xl font-bold text-green-600">
                          €{location.todayRevenue.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Clients</div>
                        <div className="text-xl font-bold">{location.todayClients}</div>
                      </div>
                    </div>
                  </div>

                  {/* View Button */}
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    View Location
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {locations.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="mx-auto h-12 w-12 mb-3 opacity-50" />
            <p>No locations found</p>
            <Button variant="outline" size="sm" className="mt-4">
              Add First Location
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
