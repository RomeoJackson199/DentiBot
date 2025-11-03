import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, ChefHat, CheckCircle, UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderStatusTrackerProps {
  orderId: string;
  compact?: boolean;
}

export function OrderStatusTracker({ orderId, compact = false }: OrderStatusTrackerProps) {
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [orderStatus, setOrderStatus] = useState<string>('draft');

  useEffect(() => {
    loadOrderData();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`order-status-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
          filter: `order_id=eq.${orderId}`,
        },
        () => {
          loadOrderData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'restaurant_orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrderStatus(payload.new.order_status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const loadOrderData = async () => {
    const { data: items } = await supabase
      .from('order_items')
      .select('*, service:business_services(name)')
      .eq('order_id', orderId);

    if (items) setOrderItems(items);

    const { data: order } = await supabase
      .from('restaurant_orders')
      .select('order_status')
      .eq('id', orderId)
      .single();

    if (order) setOrderStatus(order.order_status);
  };

  const getStatusProgress = () => {
    const statuses = ['draft', 'confirmed', 'preparing', 'ready', 'served'];
    const currentIndex = statuses.indexOf(orderStatus);
    return ((currentIndex + 1) / statuses.length) * 100;
  };

  const getItemStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'preparing':
        return <ChefHat className="h-4 w-4 text-blue-600" />;
      case 'ready':
        return <UtensilsCrossed className="h-4 w-4 text-green-600" />;
      case 'served':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Order Status:</span>
          <Badge variant={orderStatus === 'served' ? 'default' : 'secondary'}>
            {getStatusLabel(orderStatus)}
          </Badge>
        </div>
        <Progress value={getStatusProgress()} className="h-2" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Order Status</span>
          <Badge variant={orderStatus === 'served' ? 'default' : 'secondary'}>
            {getStatusLabel(orderStatus)}
          </Badge>
        </CardTitle>
        <CardDescription>Track your order in real-time</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>Overall Progress</span>
            <span>{Math.round(getStatusProgress())}%</span>
          </div>
          <Progress value={getStatusProgress()} className="h-3" />
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Items:</h4>
          {orderItems.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                item.item_status === 'served' && "bg-green-50 border-green-200"
              )}
            >
              <div className="flex items-center gap-3">
                {getItemStatusIcon(item.item_status)}
                <div>
                  <p className="font-medium text-sm">{item.service?.name}</p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                </div>
              </div>
              <Badge 
                variant={item.item_status === 'served' ? 'default' : 'outline'}
                className="text-xs"
              >
                {getStatusLabel(item.item_status)}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
