import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CalendarDays, Users, Clock } from 'lucide-react';

interface RestaurantReservationsProps {
  businessId: string;
}

export function RestaurantReservations({ businessId }: RestaurantReservationsProps) {
  const { data: reservations, isLoading } = useQuery({
    queryKey: ['restaurant-reservations', businessId],
    queryFn: async () => {
      // First get appointments for this business
      const { data: appointments, error: apptError } = await supabase
        .from('appointments')
        .select('id')
        .eq('business_id', businessId);
      
      if (apptError) throw apptError;
      const appointmentIds = appointments?.map(a => a.id) || [];

      // Then get reservations for those appointments
      const { data, error } = await supabase
        .from('table_reservations')
        .select(`
          *,
          appointments:appointment_id (
            appointment_date,
            patient_id,
            profiles:patient_id (
              first_name,
              last_name,
              email,
              phone
            )
          ),
          restaurant_tables:table_id (
            table_number,
            capacity
          )
        `)
        .in('appointment_id', appointmentIds)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'seated': return 'secondary';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return <div>Loading reservations...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Reservations</h2>
        <p className="text-muted-foreground">View and manage customer reservations</p>
      </div>

      <div className="grid gap-4">
        {reservations?.map((reservation: any) => (
          <Card key={reservation.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {reservation.appointments?.profiles?.first_name} {reservation.appointments?.profiles?.last_name}
                    <Badge variant={getStatusColor(reservation.reservation_status)}>
                      {reservation.reservation_status}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {reservation.appointments?.profiles?.email}
                    {reservation.appointments?.profiles?.phone && ` • ${reservation.appointments?.profiles?.phone}`}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {format(new Date(reservation.appointments?.appointment_date), 'PPp')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {reservation.party_size} {reservation.party_size === 1 ? 'guest' : 'guests'}
                  </span>
                </div>
                {reservation.restaurant_tables && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {reservation.restaurant_tables.table_number} (Capacity: {reservation.restaurant_tables.capacity})
                    </span>
                  </div>
                )}
              </div>
              {reservation.special_requests && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium">Special Requests:</p>
                  <p className="text-sm text-muted-foreground mt-1">{reservation.special_requests}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {reservations?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No reservations yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
