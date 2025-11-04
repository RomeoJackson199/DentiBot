import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useBusinessContext } from '@/hooks/useBusinessContext';
import { DollarSign, CreditCard, Banknote, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface QuickCheckoutProps {
  appointmentId: string;
  clientName: string;
  stylistId: string;
  stylistName: string;
  servicePrice: number;
  serviceName: string;
  onComplete: () => void;
  onCancel: () => void;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export function QuickCheckout({
  appointmentId,
  clientName,
  stylistId,
  stylistName,
  servicePrice,
  serviceName,
  onComplete,
  onCancel,
}: QuickCheckoutProps) {
  const { businessId } = useBusinessContext();
  const { toast } = useToast();

  const [selectedProducts, setSelectedProducts] = useState<(Product & { quantity: number })[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [tipPercent, setTipPercent] = useState(15);
  const [customTip, setCustomTip] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [validPromo, setValidPromo] = useState<{ id: string; code: string; discount_type: string; discount_value: number } | null>(null);

  useEffect(() => {
    loadProducts();
  }, [businessId]);

  const loadProducts = async () => {
    if (!businessId) return;

    const { data, error } = await supabase
      .from('business_services')
      .select('id, name, price_cents, stock_quantity')
      .eq('business_id', businessId)
      .eq('is_retail', true)
      .eq('is_active', true)
      .gt('stock_quantity', 0)
      .order('name');

    if (!error && data) {
      setAvailableProducts(
        data.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price_cents / 100,
          stock: p.stock_quantity || 0,
        }))
      );
    }
  };

  const addProduct = (product: Product) => {
    const existing = selectedProducts.find((p) => p.id === product.id);
    if (existing) {
      setSelectedProducts(
        selectedProducts.map((p) =>
          p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
        )
      );
    } else {
      setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }]);
    }
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== productId));
  };

  const tipAmount = customTip
    ? parseFloat(customTip) || 0
    : Math.round((servicePrice * tipPercent) / 100 * 100) / 100;

  const productTotal = selectedProducts.reduce(
    (sum, p) => sum + p.price * p.quantity,
    0
  );
  const subtotal = servicePrice + productTotal;
  
  // Apply promo code discount
  let discountAmount = 0;
  if (validPromo) {
    if (validPromo.discount_type === 'free') {
      discountAmount = subtotal;
    } else if (validPromo.discount_type === 'percentage') {
      discountAmount = Math.round((subtotal * validPromo.discount_value) / 100 * 100) / 100;
    } else if (validPromo.discount_type === 'fixed') {
      discountAmount = Math.min(validPromo.discount_value / 100, subtotal);
    }
  }
  
  const total = subtotal - discountAmount + tipAmount;

  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a promo code',
        variant: 'destructive',
      });
      return;
    }

    setValidatingPromo(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-promo-code', {
        body: { code: promoCode.trim() },
      });

      if (error) throw error;

      if (data.valid) {
        setValidPromo(data.promoCode);
        toast({
          title: 'Promo Code Applied!',
          description: data.promoCode.discount_type === 'free' 
            ? 'This checkout is now FREE!' 
            : `Discount applied successfully`,
        });
      } else {
        toast({
          title: 'Invalid Code',
          description: data.message || 'This promo code is not valid',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Promo validation error:', error);
      toast({
        title: 'Error',
        description: 'Could not validate promo code',
        variant: 'destructive',
      });
    } finally {
      setValidatingPromo(false);
    }
  };

  const handlePayment = async (method: 'card' | 'cash') => {
    if (!businessId) return;

    setIsProcessing(true);

    try {
      // 1. Record tip if any
      if (tipAmount > 0) {
        const { error: tipError } = await supabase.from('service_tips').insert({
          appointment_id: appointmentId,
          stylist_id: stylistId,
          business_id: businessId,
          amount_cents: Math.round(tipAmount * 100),
          payment_method: method,
        });

        if (tipError) throw tipError;
      }

      // 2. Record product sales
      for (const product of selectedProducts) {
        const { error: saleError } = await supabase.from('product_sales').insert({
          product_id: product.id,
          appointment_id: appointmentId,
          business_id: businessId,
          quantity: product.quantity,
          price_cents: Math.round(product.price * 100),
          sold_by_stylist_id: stylistId,
        });

        if (saleError) throw saleError;

        // Update stock
        const { error: stockError } = await supabase.rpc('decrement_product_stock', {
          product_id: product.id,
          quantity: product.quantity,
        });

        if (stockError) {
          console.warn('Could not update stock:', stockError);
        }
      }

      // 3. Update appointment status to completed
      const { error: apptError } = await supabase
        .from('appointments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', appointmentId);

      if (apptError) throw apptError;

      // 4. Update promo code usage if used
      if (validPromo) {
        try {
          await supabase.rpc('increment_promo_usage', {
            promo_id: validPromo.id
          });
        } catch (err) {
          console.error('Failed to update promo code usage:', err);
        }
      }

      // Show success
      setShowSuccess(true);

      toast({
        title: 'Payment Complete!',
        description: validPromo?.discount_type === 'free' 
          ? 'FREE checkout with promo code!' 
          : `€${total.toFixed(2)} charged via ${method}`,
      });

      // Wait a moment then call onComplete
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Failed',
        description: error instanceof Error ? error.message : 'Could not process payment',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (showSuccess) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-12 pb-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Payment Complete!</h2>
          <p className="text-muted-foreground mb-4">
            Receipt sent to client
          </p>
          <div className="text-3xl font-bold text-green-600">
            €{total.toFixed(2)}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardTitle className="text-2xl">💳 Checkout</CardTitle>
        <div className="space-y-1 text-sm">
          <p className="font-medium">{clientName}</p>
          <p className="text-muted-foreground">Stylist: {stylistName}</p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(), 'EEEE, MMMM d, yyyy • h:mm a')}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Service */}
        <div>
          <div className="flex justify-between items-center py-3 border-b">
            <div>
              <p className="font-medium">{serviceName}</p>
              <p className="text-sm text-muted-foreground">Service</p>
            </div>
            <p className="text-lg font-semibold">€{servicePrice.toFixed(2)}</p>
          </div>
        </div>

        {/* Products */}
        <div>
          <Label className="text-base font-semibold mb-3 block">➕ Add Products?</Label>

          {/* Selected Products */}
          {selectedProducts.length > 0 && (
            <div className="space-y-2 mb-3">
              {selectedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex justify-between items-center p-2 bg-muted rounded"
                >
                  <div className="flex-1">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      €{product.price.toFixed(2)} × {product.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">€{(product.price * product.quantity).toFixed(2)}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProduct(product.id)}
                      disabled={isProcessing}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Available Products */}
          <div className="grid grid-cols-2 gap-2">
            {availableProducts.slice(0, 6).map((product) => (
              <Button
                key={product.id}
                variant="outline"
                className="h-auto py-3 flex flex-col items-start text-left"
                onClick={() => addProduct(product)}
                disabled={isProcessing}
              >
                <span className="font-medium text-sm">{product.name}</span>
                <span className="text-xs text-muted-foreground">€{product.price.toFixed(2)}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Subtotal */}
        {selectedProducts.length > 0 && (
          <div className="flex justify-between py-2 border-t">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold">€{subtotal.toFixed(2)}</span>
          </div>
        )}

        {/* Promo Code */}
        <div className="space-y-3 border-t pt-4">
          <Label className="text-base font-semibold">🎁 Promo Code</Label>
          
          {validPromo ? (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
              <div>
                <p className="font-semibold text-green-700">{validPromo.code}</p>
                <p className="text-sm text-green-600">
                  {validPromo.discount_type === 'free' ? 'FREE Checkout!' : 'Discount Applied'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setValidPromo(null);
                  setPromoCode('');
                }}
                disabled={isProcessing}
              >
                Remove
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Enter promo code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                disabled={validatingPromo || isProcessing}
              />
              <Button
                onClick={validatePromoCode}
                disabled={validatingPromo || isProcessing || !promoCode.trim()}
              >
                {validatingPromo ? 'Checking...' : 'Apply'}
              </Button>
            </div>
          )}
        </div>

        {/* Tip Selection */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">💵 Tip for {stylistName.split(' ')[0]}?</Label>

          <div className="grid grid-cols-4 gap-2">
            {[10, 15, 20, 25].map((percent) => (
              <Button
                key={percent}
                variant={tipPercent === percent && !customTip ? 'default' : 'outline'}
                onClick={() => {
                  setTipPercent(percent);
                  setCustomTip('');
                }}
                className="flex flex-col h-16"
                disabled={isProcessing}
              >
                <span className="text-sm font-semibold">{percent}%</span>
                <span className="text-xs">
                  €{Math.round((servicePrice * percent) / 100)}
                </span>
              </Button>
            ))}
          </div>

          <div className="flex gap-2 items-center">
            <Label className="min-w-fit">Custom:</Label>
            <div className="relative flex-1">
              <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={customTip}
                onChange={(e) => {
                  setCustomTip(e.target.value);
                  setTipPercent(0);
                }}
                className="pl-7"
                disabled={isProcessing}
              />
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="border-t-2 pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xl font-bold">TOTAL</span>
            <span className="text-3xl font-bold text-primary">€{total.toFixed(2)}</span>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Service</span>
              <span>€{servicePrice.toFixed(2)}</span>
            </div>
            {productTotal > 0 && (
              <div className="flex justify-between">
                <span>Products</span>
                <span>€{productTotal.toFixed(2)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({validPromo?.code})</span>
                <span>-€{discountAmount.toFixed(2)}</span>
              </div>
            )}
            {tipAmount > 0 && (
              <div className="flex justify-between">
                <span>Tip</span>
                <span>€{tipAmount.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Payment Method</Label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              size="lg"
              onClick={() => handlePayment('card')}
              disabled={isProcessing}
              className="h-20 flex flex-col gap-2"
            >
              <CreditCard className="h-6 w-6" />
              <span>Card</span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => handlePayment('cash')}
              disabled={isProcessing}
              className="h-20 flex flex-col gap-2"
            >
              <Banknote className="h-6 w-6" />
              <span>Cash</span>
            </Button>
          </div>
        </div>

        {/* Cancel Button */}
        <Button
          variant="ghost"
          className="w-full"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </Button>
      </CardContent>
    </Card>
  );
}
