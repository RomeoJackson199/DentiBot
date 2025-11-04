import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useBusinessContext } from '@/hooks/useBusinessContext';
import { Clock, User, DollarSign, Users } from 'lucide-react';
import { format } from 'date-fns';

interface StylistStatus {
  id: string;
  firstName: string;
  lastName: string;
  profilePhoto: string | null;
  status: 'free' | 'busy' | 'break';
  currentClient?: string;
  finishTime?: Date;
  todayRevenue: number;
  todayClients: number;
  specialties: string[];
  stylistLevel: string;
}

interface TeamStatusBoardProps {
  onAssignWalkIn?: (stylistId: string) => void;
}

export function TeamStatusBoard({ onAssignWalkIn }: TeamStatusBoardProps) {
  const { businessId } = useBusinessContext();
  const [stylists, setStylists] = useState<StylistStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (!businessId) return;

    loadTeamStatus();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadTeamStatus();
    }, 30000);

    // Set up real-time subscription for appointments
    const subscription = supabase
      .channel('team-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `business_id=eq.${businessId}`,
        },
        () => {
          loadTeamStatus();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [businessId]);

  const loadTeamStatus = async () => {
    if (!businessId) return;

    try {
      // Get all active stylists for this business
      const { data: membersData } = await supabase
        .from('business_members')
        .select('profile_id')
        .eq('business_id', businessId);

      if (!membersData || membersData.length === 0) {
        setStylists([]);
        setLoading(false);
        return;
      }

      const profileIds = membersData.map((m) => m.profile_id);

      const { data: stylistsData, error: stylistsError } = await supabase
        .from('dentists')
        .select(`
          id,
          profile_id,
          specialties,
          stylist_level,
          profiles:profile_id (
            first_name,
            last_name,
            profile_photo_url
          )
        `)
        .in('profile_id', profileIds)
        .eq('is_active', true);

      if (stylistsError) throw stylistsError;

      if (!stylistsData || stylistsData.length === 0) {
        setStylists([]);
        setLoading(false);
        return;
      }

      // For each stylist, get their current status
      const statusPromises = stylistsData.map(async (stylist) => {
        // Use the database function to get status
        const { data: statusData } = await supabase.rpc('get_stylist_status', {
          stylist_id_param: stylist.id,
          business_id_param: businessId,
        });

        const status = statusData?.[0];

        return {
          id: stylist.id,
          firstName: stylist.profiles?.first_name || '',
          lastName: stylist.profiles?.last_name || '',
          profilePhoto: stylist.profiles?.profile_photo_url || null,
          status: status?.status || 'free',
          currentClient: status?.current_client,
          finishTime: status?.finish_time ? new Date(status.finish_time) : undefined,
          todayRevenue: (status?.today_revenue_cents || 0) / 100,
          todayClients: status?.today_clients || 0,
          specialties: stylist.specialties || [],
          stylistLevel: stylist.stylist_level || 'stylist',
        } as StylistStatus;
      });

      const statuses = await Promise.all(statusPromises);
      setStylists(statuses);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading team status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'free':
        return 'bg-green-500';
      case 'busy':
        return 'bg-red-500';
      case 'break':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'free':
        return '🟢';
      case 'busy':
        return '🔴';
      case 'break':
        return '🟡';
      default:
        return '⚪';
    }
  };

  const getLevelBadge = (level: string) => {
    const colors = {
      junior: 'bg-blue-100 text-blue-800',
      stylist: 'bg-purple-100 text-purple-800',
      senior: 'bg-orange-100 text-orange-800',
      master: 'bg-yellow-100 text-yellow-800',
    };
    return colors[level as keyof typeof colors] || colors.stylist;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (stylists.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No team members found</p>
            <p className="text-sm mt-2">Add stylists to your team to see their status here</p>
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
            <CardTitle className="text-2xl">👥 Team Status (Live)</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Last updated: {format(lastUpdate, 'h:mm:ss a')}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadTeamStatus}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stylists.map((stylist) => (
            <div
              key={stylist.id}
              className="flex items-center gap-4 p-4 border-2 rounded-lg hover:shadow-md transition-shadow"
            >
              {/* Profile Photo */}
              <div className="relative">
                {stylist.profilePhoto ? (
                  <img
                    src={stylist.profilePhoto}
                    className="w-16 h-16 rounded-full object-cover"
                    alt={`${stylist.firstName} ${stylist.lastName}`}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                    {stylist.firstName[0]}
                    {stylist.lastName[0]}
                  </div>
                )}
                {/* Status indicator */}
                <div
                  className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white ${getStatusColor(
                    stylist.status
                  )}`}
                ></div>
              </div>

              {/* Stylist Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg truncate">
                    {stylist.firstName} {stylist.lastName}
                  </h3>
                  <Badge className={getLevelBadge(stylist.stylistLevel)} variant="outline">
                    {stylist.stylistLevel}
                  </Badge>
                  <Badge className={getStatusColor(stylist.status)} variant="default">
                    {getStatusIcon(stylist.status)} {stylist.status.toUpperCase()}
                  </Badge>
                </div>

                {/* Current Status */}
                {stylist.status === 'busy' && stylist.currentClient && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <User className="h-4 w-4" />
                    <span>
                      With {stylist.currentClient} • Finishes at{' '}
                      {stylist.finishTime && format(stylist.finishTime, 'h:mm a')}
                    </span>
                  </div>
                )}

                {stylist.status === 'free' && (
                  <p className="text-sm text-green-600 font-medium mb-2">
                    ✨ Available for walk-ins!
                  </p>
                )}

                {/* Specialties */}
                {stylist.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {stylist.specialties.slice(0, 3).map((specialty, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                    {stylist.specialties.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{stylist.specialties.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Today's Stats */}
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{stylist.todayClients}</span>
                    <span className="text-muted-foreground">clients</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-medium">€{stylist.todayRevenue.toFixed(0)}</span>
                    <span className="text-muted-foreground">revenue</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex flex-col gap-2">
                {stylist.status === 'free' && onAssignWalkIn && (
                  <Button
                    onClick={() => onAssignWalkIn(stylist.id)}
                    className="whitespace-nowrap"
                  >
                    Assign Walk-in
                  </Button>
                )}
                {stylist.status === 'busy' && stylist.finishTime && (
                  <div className="text-center">
                    <Clock className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">
                      {Math.ceil(
                        (stylist.finishTime.getTime() - new Date().getTime()) / 1000 / 60
                      )}
                      m left
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
