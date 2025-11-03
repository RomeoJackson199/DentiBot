import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseOrderNotificationsProps {
  businessId: string;
  role: 'waiter' | 'cook' | 'customer';
  orderId?: string;
}

export function useOrderNotifications({ businessId, role, orderId }: UseOrderNotificationsProps) {
  const { toast } = useToast();

  useEffect(() => {
    if (!businessId) return;

    let channel;

    if (role === 'cook') {
      // Kitchen: Listen for new orders and confirmed orders
      channel = supabase
        .channel('kitchen-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'order_items',
          },
          async (payload) => {
            // Check if this item belongs to our business
            const { data: order } = await supabase
              .from('restaurant_orders')
              .select('business_id')
              .eq('id', payload.new.order_id)
              .single();

            if (order?.business_id === businessId) {
              playNotificationSound();
              toast({
                title: '🔔 New Order Item!',
                description: 'A new item needs to be prepared',
              });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'restaurant_orders',
            filter: `order_status=eq.confirmed`,
          },
          async (payload) => {
            if (payload.new.business_id === businessId && payload.old.order_status !== 'confirmed') {
              playNotificationSound();
              toast({
                title: '🔔 Order Confirmed!',
                description: 'Start preparing the items',
              });
            }
          }
        )
        .subscribe();
    } else if (role === 'waiter') {
      // Waiter: Listen for ready items
      channel = supabase
        .channel('waiter-notifications')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'order_items',
            filter: `item_status=eq.ready`,
          },
          async (payload) => {
            // Check if this item belongs to our business
            const { data: order } = await supabase
              .from('restaurant_orders')
              .select('business_id')
              .eq('id', payload.new.order_id)
              .single();

            if (order?.business_id === businessId && payload.old.item_status !== 'ready') {
              playNotificationSound();
              toast({
                title: '✅ Item Ready!',
                description: 'An order item is ready to serve',
              });
            }
          }
        )
        .subscribe();
    } else if (role === 'customer' && orderId) {
      // Customer: Listen for their specific order updates
      channel = supabase
        .channel(`customer-order-${orderId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'order_items',
            filter: `order_id=eq.${orderId}`,
          },
          (payload) => {
            if (payload.new.item_status !== payload.old.item_status) {
              const status = payload.new.item_status;
              if (status === 'preparing') {
                toast({
                  title: '👨‍🍳 Cooking Started',
                  description: 'Your food is being prepared',
                });
              } else if (status === 'ready') {
                toast({
                  title: '🎉 Food Ready!',
                  description: 'Your order is ready',
                });
              }
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [businessId, role, orderId, toast]);
}

function playNotificationSound() {
  try {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvPTiTYIGGS75+ihUxILTqbj77NYEg==');
    audio.volume = 0.3;
    audio.play().catch(() => {
      // Ignore errors if user hasn't interacted with page yet
    });
  } catch (error) {
    // Ignore sound errors
  }
}
