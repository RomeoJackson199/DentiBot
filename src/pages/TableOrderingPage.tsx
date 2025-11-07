import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ModernLoadingSpinner } from '@/components/enhanced/ModernLoadingSpinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Plus, Minus, UtensilsCrossed, Clock, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OrderStatusTracker } from '@/components/restaurant/OrderStatusTracker';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';

export default function TableOrderingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const tableId = searchParams.get('table');
  const businessSlug = searchParams.get('business');

  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<any>(null);
  const [table, setTable] = useState<any>(null);
  const [reservation, setReservation] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [order, setOrder] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTableData();
  }, [tableId, businessSlug]);

  // Set up real-time notifications for customer
  useOrderNotifications({
    businessId: business?.id || '',
    role: 'customer',
    orderId: order?.id,
  });

  const loadTableData = async () => {
    try {
      if (!tableId || !businessSlug) {
        toast({ title: 'Invalid QR code', variant: 'destructive' });
        return;
      }

      // Load business
      const { data: businessData } = await supabase
        .from('businesses')
        .select('*')
        .eq('slug', businessSlug)
        .single();

      if (!businessData) throw new Error('Business not found');
      setBusiness(businessData);

      // Load table
      const { data: tableData } = await supabase
        .from('restaurant_tables')
        .select('*')
        .eq('id', tableId)
        .eq('business_id', businessData.id)
        .single();

      if (!tableData) throw new Error('Table not found');
      setTable(tableData);

      // Load active reservation for this table
      const { data: reservationData } = await supabase
        .from('table_reservations')
        .select(`
          *,
          appointment:appointments(*)
        `)
        .eq('table_id', tableId)
        .in('reservation_status', ['confirmed', 'seated'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (reservationData) {
        setReservation(reservationData);

        // Load existing order
        const { data: orderData } = await supabase
          .from('restaurant_orders')
          .select(`
            *,
            order_items(*, service:business_services(*))
          `)
          .eq('reservation_id', reservationData.id)
          .in('order_status', ['draft', 'confirmed'])
          .single();

        if (orderData) setOrder(orderData);
      }

      // Load menu
      const { data: servicesData } = await supabase
        .from('business_services')
        .select('*')
        .eq('business_id', businessData.id)
        .eq('is_active', true)
        .order('category', { ascending: true });

      setServices(servicesData || []);
    } catch (error: any) {
      toast({ title: 'Error loading menu', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (service: any) => {
    const existing = cart.find(item => item.service_id === service.id);
    if (existing) {
      setCart(cart.map(item =>
        item.service_id === service.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        service_id: service.id,
        name: service.name,
        unit_price_cents: service.price_cents,
        quantity: 1,
        special_instructions: '',
      }]);
    }
  };

  const updateQuantity = (serviceId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.service_id === serviceId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const updateInstructions = (serviceId: string, instructions: string) => {
    setCart(cart.map(item =>
      item.service_id === serviceId ? { ...item, special_instructions: instructions } : item
    ));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.unit_price_cents * item.quantity), 0);
  };

  const submitOrder = async () => {
    if (cart.length === 0) {
      toast({ title: 'Cart is empty', variant: 'destructive' });
      return;
    }

    if (!reservation) {
      toast({ title: 'No active reservation', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      // Create or update order
      let orderId = order?.id;
      
      if (!orderId) {
        const { data: newOrder, error: orderError } = await supabase
          .from('restaurant_orders')
          .insert({
            business_id: business.id,
            reservation_id: reservation.id,
            table_id: table.id,
            order_status: 'draft',
            subtotal_cents: 0,
            tax_cents: 0,
            total_cents: 0,
          })
          .select()
          .single();

        if (orderError) throw orderError;
        orderId = newOrder.id;
      }

      // Add items to order
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(
          cart.map(item => ({
            order_id: orderId,
            service_id: item.service_id,
            quantity: item.quantity,
            unit_price_cents: item.unit_price_cents,
            special_instructions: item.special_instructions,
            item_status: 'pending',
          }))
        );

      if (itemsError) throw itemsError;

      toast({ title: 'Order submitted successfully!' });
      setCart([]);
      loadTableData();
    } catch (error: any) {
      toast({ title: 'Error submitting order', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ModernLoadingSpinner />
      </div>
    );
  }

  if (!business || !table) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card>
          <CardHeader>
            <CardTitle>Invalid QR Code</CardTitle>
            <CardDescription>Please scan a valid table QR code</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const groupedServices = services.reduce((acc, service) => {
    const category = service.category || 'Menu';
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {} as Record<string, any[]>);

  const categories = Object.keys(groupedServices);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{business.name}</h1>
              <p className="text-sm text-muted-foreground">
                Table {table.table_number} • {table.capacity} seats
              </p>
            </div>
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                className="relative"
                onClick={() => document.getElementById('cart-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <ShoppingCart className="h-5 w-5" />
                {cart.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                    {cart.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Alert */}
      {!reservation && (
        <div className="container mx-auto px-4 py-4">
          <Alert>
            <UtensilsCrossed className="h-4 w-4" />
            <AlertDescription>
              No active reservation. Please speak with a staff member to be seated.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Current Order Status */}
      {order && (
        <div className="container mx-auto px-4 py-4">
          <OrderStatusTracker orderId={order.id} />
        </div>
      )}

      {/* Menu */}
      <div className="container mx-auto px-4 py-6">
        <h2 className="text-2xl font-bold mb-6">Menu</h2>
        <Tabs defaultValue={categories[0]} className="w-full">
          <TabsList className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          {categories.map((category) => (
            <TabsContent key={category} value={category}>
              <div className="grid gap-4">
                {groupedServices[category].map((service) => (
                  <Card key={service.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{service.name}</h3>
                          {service.description && (
                            <p className="text-sm text-muted-foreground">{service.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary">
                              ${(service.price_cents / 100).toFixed(2)}
                            </Badge>
                            {service.duration_minutes && (
                              <span className="text-xs text-muted-foreground flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {service.duration_minutes} min
                              </span>
                            )}
                          </div>
                        </div>
                        {service.image_url && (
                          <img
                            src={service.image_url}
                            alt={service.name}
                            className="w-20 h-20 object-cover rounded-lg ml-4"
                          />
                        )}
                      </div>
                      <Button
                        onClick={() => addToCart(service)}
                        className="w-full mt-3"
                        disabled={!reservation}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Cart */}
      {cart.length > 0 && (
        <div id="cart-section" className="sticky bottom-0 bg-background border-t">
          <div className="container mx-auto px-4 py-6 max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Your Cart</h2>
            <div className="space-y-4 mb-4">
              {cart.map((item) => (
                <Card key={item.service_id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          ${(item.unit_price_cents / 100).toFixed(2)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.service_id, -1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.service_id, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      placeholder="Special instructions (optional)"
                      value={item.special_instructions}
                      onChange={(e) => updateInstructions(item.service_id, e.target.value)}
                      rows={2}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex items-center justify-between mb-4 text-lg font-bold">
              <span>Total:</span>
              <span>${(calculateTotal() / 100).toFixed(2)}</span>
            </div>
            <Button
              onClick={submitOrder}
              disabled={submitting || !reservation}
              className="w-full"
              size="lg"
            >
              {submitting ? 'Submitting...' : 'Submit Order'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
