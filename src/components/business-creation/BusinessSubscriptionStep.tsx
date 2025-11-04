import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

interface BusinessSubscriptionStepProps {
  businessData: any;
  onComplete: () => void;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number;
  customer_limit: number;
  email_limit_monthly: number | null;
  features: string[];
}

export const BusinessSubscriptionStep = ({ businessData, onComplete }: BusinessSubscriptionStepProps) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);

  const { data: plans, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });
      
      if (error) throw error;
      
      console.log('Loaded plans:', data); // Debug log
      
      // Ensure features is properly parsed as an array
      return (data || []).map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : []
      })) as SubscriptionPlan[];
    },
  });

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      toast.error('Please select a plan');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: {
          planId: selectedPlan,
          billingCycle,
          businessData,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast.error(error.message || 'Failed to create subscription');
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="text-center space-y-3">
        <h2 className="text-3xl md:text-4xl font-bold">Choose Your Plan</h2>
        <p className="text-lg text-muted-foreground">
          Select a subscription plan to activate your business
        </p>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center gap-2 p-1 bg-muted/50 rounded-xl max-w-xs mx-auto border">
        <Button
          variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
          onClick={() => setBillingCycle('monthly')}
          className="flex-1 rounded-lg"
        >
          Monthly
        </Button>
        <Button
          variant={billingCycle === 'yearly' ? 'default' : 'ghost'}
          onClick={() => setBillingCycle('yearly')}
          className="flex-1 rounded-lg"
        >
          Yearly <span className="ml-1 text-xs">(Save 17%)</span>
        </Button>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-6 px-4">
        {plans?.map((plan, index) => {
          const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
          const isSelected = selectedPlan === plan.id;
          const isPopular = plan.slug === 'professional';
          const isPremium = plan.slug === 'enterprise';

          return (
            <Card
              key={plan.id}
              className={`relative p-8 cursor-pointer transition-all ${
                isPopular 
                  ? 'ring-2 ring-primary shadow-2xl scale-105 bg-gradient-to-br from-primary/5 to-background' 
                  : isSelected
                  ? 'ring-2 ring-primary shadow-lg'
                  : 'hover:shadow-lg hover:scale-[1.02]'
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {/* Most Popular Badge */}
              {isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="space-y-6">
                {/* Plan Header */}
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground min-h-[20px]">
                    {plan.slug === 'starter' && 'Perfect for small practices'}
                    {plan.slug === 'professional' && 'For growing practices'}
                    {plan.slug === 'enterprise' && 'For large organizations'}
                  </p>
                </div>

                {/* Pricing */}
                <div className="text-center">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-primary to-purple-600 bg-clip-text text-transparent">
                      ${price}
                    </span>
                    <span className="text-muted-foreground">
                      /{billingCycle === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3 min-h-[300px]">
                  {Array.isArray(plan.features) && plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className={`mt-0.5 rounded-full p-1 ${
                        isPopular ? 'bg-blue-100 dark:bg-blue-900' : 
                        isPremium ? 'bg-purple-100 dark:bg-purple-900' :
                        'bg-green-100 dark:bg-green-900'
                      }`}>
                        <Check className={`h-4 w-4 ${
                          isPopular ? 'text-blue-600 dark:text-blue-400' :
                          isPremium ? 'text-purple-600 dark:text-purple-400' :
                          'text-green-600 dark:text-green-400'
                        }`} />
                      </div>
                      <span className="text-sm flex-1">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Button
                  variant={isPopular ? 'default' : isSelected ? 'default' : 'outline'}
                  className={`w-full h-12 text-base font-semibold ${
                    isPopular ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan(plan.id);
                  }}
                >
                  {isSelected ? 'Selected' : isPopular ? 'Start Free Trial' : 'Get Started'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Bottom Info */}
      <div className="text-center space-y-4 pt-6">
        <p className="text-muted-foreground">
          All plans include a 14-day free trial. No credit card required.
        </p>
        
        <Button
          size="lg"
          onClick={handleSubscribe}
          disabled={!selectedPlan || loading}
          className="px-8 h-12 text-base font-semibold"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            'Continue to Payment'
          )}
        </Button>
      </div>
    </div>
  );
};
