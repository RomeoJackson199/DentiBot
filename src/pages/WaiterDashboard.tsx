import { useEffect, useState } from 'react';
import { useBusinessContext } from '@/hooks/useBusinessContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { WaiterTableList } from '@/components/restaurant/WaiterTableList';
import { WaiterOrderManager } from '@/components/restaurant/WaiterOrderManager';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function WaiterDashboard() {
  const { businessId } = useBusinessContext();
  const { toast } = useToast();
  const [selectedReservation, setSelectedReservation] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<number>(0);

  useEffect(() => {
    if (!businessId) return;

    // Subscribe to order status changes
    const channel = supabase
      .channel('waiter-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'order_items',
          filter: `item_status=eq.ready`
        },
        (payload) => {
          setNotifications(prev => prev + 1);
          toast({
            title: 'Order Ready!',
            description: 'An item is ready to be served',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, toast]);

  if (!businessId) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Waiter Dashboard</h1>
          <p className="text-muted-foreground">Manage your tables and orders</p>
        </div>
        {notifications > 0 && (
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary animate-pulse" />
            <Badge variant="destructive">{notifications} Ready</Badge>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <WaiterTableList
            businessId={businessId}
            onSelectReservation={setSelectedReservation}
            selectedReservation={selectedReservation}
          />
        </div>

        <div className="lg:col-span-2">
          {selectedReservation ? (
            <WaiterOrderManager
              reservationId={selectedReservation}
              businessId={businessId}
              onNotificationClear={() => setNotifications(0)}
            />
          ) : (
            <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">Select a table to manage orders</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
