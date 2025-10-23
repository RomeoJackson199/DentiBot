import { useState, useEffect } from "react";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  isPopular?: boolean;
}

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch plans on mount
  useEffect(() => {
    const fetchPlans = async () => {
      const { data } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });
      
      if (data) {
        setPlans(data.map((plan, idx) => ({
          ...plan,
          isPopular: idx === 0 // Pro plan is popular
        })));
      }
    };
    fetchPlans();
  }, []);

  const handleSubscribe = async (planId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to subscribe");
        navigate("/login");
        return;
      }

      // Call edge function to create Stripe checkout session
      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: { planId, billingCycle: isYearly ? 'yearly' : 'monthly' }
      });

      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to start checkout");
    } finally {
      setLoading(false);
    }
  };

  const yearlyDiscount = Math.round((1 - (plans[0]?.price_yearly || 0) / ((plans[0]?.price_monthly || 0) * 12)) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <span className="text-muted-foreground text-lg">Monthly</span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-primary"
            />
            <span className="text-muted-foreground text-lg">Yearly</span>
            {yearlyDiscount > 0 && (
              <span className="text-sm text-primary font-semibold bg-primary/10 px-3 py-1 rounded-full">
                Save {yearlyDiscount}%
              </span>
            )}
          </div>
          
          <h1 className="text-7xl md:text-9xl font-bold mb-4 bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
            PRICING
          </h1>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const price = isYearly ? plan.price_yearly / 12 : plan.price_monthly;
            const isPro = plan.name === "Pro";
            
            return (
              <Card
                key={plan.id}
                className={`relative p-8 transition-all duration-500 ${
                  isPro
                    ? "bg-gradient-to-b from-primary/20 via-primary/10 to-background border-primary/50 shadow-[0_0_50px_rgba(139,92,246,0.3)]"
                    : "bg-card/50 border-border/50 hover:border-border"
                }`}
              >
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1 bg-gradient-to-r from-primary to-primary-glow px-4 py-1 rounded-full text-primary-foreground text-sm font-semibold">
                      <Sparkles className="w-3 h-3" />
                      Popular
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-semibold mb-2">{plan.name} Plan</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold">€{price.toFixed(0)}</span>
                      <span className="text-muted-foreground">/mo</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Billed {isYearly ? 'annually' : 'monthly'}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className={`mt-0.5 rounded-full p-0.5 ${
                          isPro ? 'bg-primary/20' : 'bg-muted'
                        }`}>
                          <Check className={`w-4 h-4 ${
                            isPro ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                        </div>
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loading}
                    className={`w-full ${
                      isPro
                        ? "bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 text-primary-foreground shadow-lg"
                        : "bg-background border-2 border-border hover:bg-muted text-foreground"
                    }`}
                  >
                    {isPro ? "Get Started" : "Get Started"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>All plans can be cancelled anytime. Secure payment powered by Stripe.</p>
        </div>
      </div>
    </div>
  );
}
