import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Clock, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface KitchenOrderQueueProps {
  businessId: string;
  refreshKey: number;
}

export function KitchenOrderQueue({ businessId, refreshKey }: KitchenOrderQueueProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders } = useQuery({
    queryKey: ['kitchen-orders', businessId, refreshKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          *,
          business_services:service_id (
            name,
            description
          ),
          restaurant_orders:order_id (
            id,
            order_status,
            created_at,
            restaurant_tables:table_id (
              table_number
            )
          )
        `)
        .in('item_status', ['pending', 'preparing'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    refetchInterval: 15000,
  });

  const startPreparingMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('order_items')
        .update({ item_status: 'preparing' })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      toast({ title: 'Started preparing item' });
    },
  });

  const markReadyMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('order_items')
        .update({ 
          item_status: 'ready',
          prepared_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      toast({ title: 'Item marked as ready!' });
    },
  });

  const groupedOrders = orders?.reduce((acc: any, item: any) => {
    const orderId = item.order_id;
    if (!acc[orderId]) {
      acc[orderId] = {
        order: item.restaurant_orders,
        items: [],
      };
    }
    acc[orderId].items.push(item);
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Object.entries(groupedOrders || {}).map(([orderId, orderData]: [string, any]) => (
        <Card key={orderId} className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                Table: {orderData.order?.restaurant_tables?.table_number || 'Unknown'}
                <Badge variant="outline">
                  {orderData.items.length} {orderData.items.length === 1 ? 'item' : 'items'}
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {formatDistanceToNow(new Date(orderData.order?.created_at), { addSuffix: true })}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {orderData.items.map((item: any) => (
              <div key={item.id} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-lg">
                      {item.quantity}× {item.business_services?.name}
                    </div>
                    {item.special_instructions && (
                      <div className="text-sm text-destructive font-medium mt-1 p-2 bg-destructive/10 rounded">
                        ⚠️ {item.special_instructions}
                      </div>
                    )}
                  </div>
                  <Badge variant={item.item_status === 'preparing' ? 'default' : 'secondary'}>
                    {item.item_status}
                  </Badge>
                </div>

                <div className="flex gap-2 mt-3">
                  {item.item_status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => startPreparingMutation.mutate(item.id)}
                      className="flex-1"
                    >
                      Start Preparing
                    </Button>
                  )}
                  {item.item_status === 'preparing' && (
                    <Button
                      size="sm"
                      onClick={() => markReadyMutation.mutate(item.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Ready
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {(!orders || orders.length === 0) && (
        <Card className="col-span-full">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl font-semibold">All caught up!</p>
            <p className="text-muted-foreground">No orders to prepare right now</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
