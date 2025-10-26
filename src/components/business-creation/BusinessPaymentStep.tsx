import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, CreditCard } from 'lucide-react';

interface BusinessPaymentStepProps {
  businessData: any;
  onComplete: (businessId: string) => void;
}

export function BusinessPaymentStep({ businessData, onComplete }: BusinessPaymentStepProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Store business data in sessionStorage to create after payment
      sessionStorage.setItem('pending_business_data', JSON.stringify(businessData));

      // Create Stripe checkout session for $0.50
      const { data, error } = await supabase.functions.invoke('create-business-payment', {
        body: {
          amount: 50, // 50 cents
          successUrl: `${window.location.origin}/payment-success?type=business`,
          cancelUrl: `${window.location.origin}/create-business`,
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
            <p className="text-3xl font-bold text-primary my-2">$0.50</p>
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

          <Button
            onClick={handlePayment}
            disabled={loading || !businessData.name}
            size="lg"
            className="w-full"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Pay $0.50 to Create Business
          </Button>

          <p className="text-xs text-muted-foreground">
            Secure payment powered by Stripe
          </p>
        </div>
      </Card>
    </div>
  );
}
