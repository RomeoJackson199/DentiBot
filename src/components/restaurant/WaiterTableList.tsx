import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface WaiterTableListProps {
  businessId: string;
  onSelectReservation: (id: string) => void;
  selectedReservation: string | null;
}

export function WaiterTableList({ businessId, onSelectReservation, selectedReservation }: WaiterTableListProps) {
  const { data: reservations, isLoading } = useQuery({
    queryKey: ['waiter-tables', businessId],
    queryFn: async () => {
      // Get current profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Get today's reservations that are seated or confirmed
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: appointments } = await supabase
        .from('appointments')
        .select('id')
        .eq('business_id', businessId)
        .gte('appointment_date', today.toISOString())
        .lt('appointment_date', tomorrow.toISOString());

      const appointmentIds = appointments?.map(a => a.id) || [];

      const { data, error } = await supabase
        .from('table_reservations')
        .select(`
          *,
          appointments:appointment_id (
            appointment_date,
            profiles:patient_id (
              first_name,
              last_name
            )
          ),
          restaurant_tables:table_id (
            table_number,
            capacity
          )
        `)
        .in('appointment_id', appointmentIds)
        .in('reservation_status', ['confirmed', 'seated'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading tables...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Tables</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {reservations?.map((reservation: any) => (
          <Button
            key={reservation.id}
            variant={selectedReservation === reservation.id ? 'default' : 'outline'}
            className="w-full justify-start h-auto py-4"
            onClick={() => onSelectReservation(reservation.id)}
          >
            <div className="flex flex-col items-start gap-2 w-full">
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold">
                  {reservation.restaurant_tables?.table_number || 'Not Assigned'}
                </span>
                <Badge variant={reservation.reservation_status === 'seated' ? 'default' : 'secondary'}>
                  {reservation.reservation_status}
                </Badge>
              </div>
              <div className="text-xs text-left">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {reservation.appointments?.profiles?.first_name} {reservation.appointments?.profiles?.last_name}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Users className="h-3 w-3" />
                  {reservation.party_size} guests
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(reservation.appointments?.appointment_date), 'p')}
                </div>
              </div>
            </div>
          </Button>
        ))}

        {reservations?.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No active tables assigned
          </p>
        )}
      </CardContent>
    </Card>
  );
}
