import { useEffect, useState } from 'react';
import { useBusinessContext } from '@/hooks/useBusinessContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { KitchenOrderQueue } from '@/components/restaurant/KitchenOrderQueue';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import { ChefHat } from 'lucide-react';

export default function KitchenDashboard() {
  const { businessId } = useBusinessContext();
  const { toast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);

  // Set up real-time notifications
  useOrderNotifications({
    businessId: businessId || '',
    role: 'cook',
  });

  useEffect(() => {
    if (!businessId) return;

    // Subscribe to new orders
    const channel = supabase
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_items',
        },
        (payload) => {
          setRefreshKey(prev => prev + 1);
          toast({
            title: 'New Order!',
            description: 'A new order item needs to be prepared',
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'restaurant_orders',
          filter: `order_status=eq.confirmed`
        },
        (payload) => {
          setRefreshKey(prev => prev + 1);
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
      <div className="flex items-center gap-3">
        <ChefHat className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Kitchen Dashboard</h1>
          <p className="text-muted-foreground">Prepare and manage orders</p>
        </div>
      </div>

      <KitchenOrderQueue businessId={businessId} refreshKey={refreshKey} />
    </div>
  );
}
