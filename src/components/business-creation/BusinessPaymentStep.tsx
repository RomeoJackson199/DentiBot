import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, CreditCard, Tag, Check } from 'lucide-react';
import { logger } from '@/lib/logger';

interface BusinessPaymentStepProps {
  businessData: any;
  onComplete: (businessId: string) => void;
}

export function BusinessPaymentStep({ businessData, onComplete }: BusinessPaymentStepProps) {
  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [validPromo, setValidPromo] = useState<any>(null);

  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }

    setValidatingPromo(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-promo-code', {
        body: { code: promoCode.trim().toUpperCase() },
      });

      if (error) throw error;

      if (data?.valid) {
        setValidPromo(data.promoCode);
        toast.success('Promo code applied successfully!');
      } else {
        toast.error('Invalid or expired promo code');
        setValidPromo(null);
      }
    } catch (error: any) {
      console.error('Promo validation error:', error);
      toast.error(error.message || 'Failed to validate promo code');
      setValidPromo(null);
    } finally {
      setValidatingPromo(false);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Store business data in sessionStorage to create after payment
      sessionStorage.setItem('pending_business_data', JSON.stringify(businessData));

      // If promo code makes it free, create business directly
      if (validPromo && validPromo.discount_type === 'free') {
        // Store promo code info
        sessionStorage.setItem('promo_code_used', JSON.stringify(validPromo));

        // Redirect to payment success page which will create the business
        window.location.href = `${window.location.origin}/payment-success?type=business&promo=true`;
        return;
      }

      // Create Stripe checkout session for $1.00
      const { data, error } = await supabase.functions.invoke('create-business-payment', {
        body: {
          amount: 100, // 100 cents = $1.00
          successUrl: `${window.location.origin}/payment-success?type=business`,
          cancelUrl: `${window.location.origin}/create-business`,
          promoCode: validPromo?.code,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment setup failed');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Complete Your Setup</h2>
        <p className="text-muted-foreground mt-2">
          Final step: Activate your business account
        </p>
      </div>

      <Card className="p-6 border-2 border-primary/20">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-primary" />
          </div>

          <div>
            <h3 className="text-xl font-semibold">Activation Fee</h3>
            <p className="text-3xl font-bold text-primary my-2">$1.00</p>
            <p className="text-sm text-muted-foreground">
              One-time setup fee to activate your business account
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span className="text-sm">Full access to all features</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span className="text-sm">Unlimited appointments</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span className="text-sm">Customer management</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span className="text-sm">Analytics dashboard</span>
            </div>
          </div>

          {/* Promo Code Section */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Tag className="w-4 h-4" />
              <span>Have a promo code?</span>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Enter promo code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                disabled={validatingPromo || !!validPromo}
                className="flex-1"
              />
              <Button
                onClick={validatePromoCode}
                disabled={validatingPromo || !promoCode.trim() || !!validPromo}
                variant="outline"
              >
                {validatingPromo && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {validPromo && <Check className="w-4 h-4 mr-2" />}
                {validPromo ? 'Applied' : 'Apply'}
              </Button>
            </div>
            {validPromo && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-medium">
                    {validPromo.discount_type === 'free' ? 'FREE!' : `Discount applied: ${validPromo.discount_value}%`}
                  </span>
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={handlePayment}
            disabled={loading || !businessData.name}
            size="lg"
            className="w-full"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {validPromo && validPromo.discount_type === 'free' ? 'Create Business (FREE)' : 'Pay $1.00 to Create Business'}
          </Button>

          <p className="text-xs text-muted-foreground">
            Secure payment powered by Stripe
          </p>
        </div>
      </Card>
    </div>
  );
}
