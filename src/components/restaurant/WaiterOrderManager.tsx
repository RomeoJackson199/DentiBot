import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Check, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface WaiterOrderManagerProps {
  reservationId: string;
  businessId: string;
  onNotificationClear: () => void;
}

export function WaiterOrderManager({ reservationId, businessId, onNotificationClear }: WaiterOrderManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({
    service_id: '',
    quantity: 1,
    special_instructions: '',
  });

  const { data: order } = useQuery({
    queryKey: ['waiter-order', reservationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_orders')
        .select(`
          *,
          order_items (
            *,
            business_services:service_id (
              name,
              price_cents,
              description
            )
          )
        `)
        .eq('reservation_id', reservationId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });

  const { data: menuItems } = useQuery({
    queryKey: ['menu-items', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_services')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const { data: reservation } = await supabase
        .from('table_reservations')
        .select('table_id')
        .eq('id', reservationId)
        .single();

      const { data, error } = await supabase
        .from('restaurant_orders')
        .insert({
          business_id: businessId,
          reservation_id: reservationId,
          table_id: reservation?.table_id,
          waiter_id: profile?.id,
          order_status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiter-order'] });
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const menuItem = menuItems?.find(m => m.id === newItem.service_id);
      if (!menuItem) throw new Error('Menu item not found');

      const { error } = await supabase
        .from('order_items')
        .insert({
          order_id: orderId,
          service_id: newItem.service_id,
          quantity: newItem.quantity,
          unit_price_cents: menuItem.price_cents,
          special_instructions: newItem.special_instructions,
        });

      if (error) throw error;
      
      // Calculate order totals
      await supabase.functions.invoke('calculate-order-total', {
        body: { orderId }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiter-order'] });
      setIsAddingItem(false);
      setNewItem({ service_id: '', quantity: 1, special_instructions: '' });
      toast({ title: 'Item added to order' });
    },
  });

  const confirmOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase.functions.invoke('confirm-restaurant-order', {
        body: { orderId }
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiter-order'] });
      toast({ title: 'Order sent to kitchen!' });
    },
  });

  const markServedMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('order_items')
        .update({ item_status: 'served', served_at: new Date().toISOString() })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiter-order'] });
      onNotificationClear();
      toast({ title: 'Item marked as served' });
    },
  });

  const processPaymentMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.functions.invoke('process-restaurant-payment', {
        body: { 
          orderId,
          returnUrl: window.location.origin + '/payment-success'
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  const handleAddItem = async () => {
    if (!order) {
      const newOrder = await createOrderMutation.mutateAsync();
      await addItemMutation.mutateAsync(newOrder.id);
    } else {
      await addItemMutation.mutateAsync(order.id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary">Pending</Badge>;
      case 'preparing': return <Badge variant="default">Preparing</Badge>;
      case 'ready': return <Badge className="bg-green-600">Ready</Badge>;
      case 'served': return <Badge variant="outline">Served</Badge>;
      default: return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Order Management</CardTitle>
          <div className="flex gap-2">
            <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Menu Item</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Menu Item</Label>
                    <Select value={newItem.service_id} onValueChange={(value) => setNewItem({ ...newItem, service_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {menuItems?.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} - ${(item.price_cents / 100).toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Special Instructions</Label>
                    <Input
                      value={newItem.special_instructions}
                      onChange={(e) => setNewItem({ ...newItem, special_instructions: e.target.value })}
                      placeholder="No onions, extra spicy, etc."
                    />
                  </div>
                  <Button onClick={handleAddItem} className="w-full">
                    Add to Order
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            {order && order.order_status === 'draft' && (
              <Button size="sm" onClick={() => confirmOrderMutation.mutate(order.id)}>
                <Check className="h-4 w-4 mr-2" />
                Confirm Order
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!order || !order.order_items || order.order_items.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No items ordered yet</p>
        ) : (
          <div className="space-y-4">
            {order.order_items.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="font-semibold">{item.business_services?.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Quantity: {item.quantity} × ${(item.unit_price_cents / 100).toFixed(2)}
                  </div>
                  {item.special_instructions && (
                    <div className="text-sm text-muted-foreground italic mt-1">
                      {item.special_instructions}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(item.item_status)}
                  {item.item_status === 'ready' && (
                    <Button size="sm" onClick={() => markServedMutation.mutate(item.id)}>
                      Serve
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>${(order.total_cents / 100).toFixed(2)}</span>
              </div>
            </div>

            {order.order_status === 'served' && (
              <Button className="w-full" size="lg" onClick={() => processPaymentMutation.mutate(order.id)}>
                <DollarSign className="h-4 w-4 mr-2" />
                Process Payment
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
