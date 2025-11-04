import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  isPopular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 99,
    features: [
      "Normal booking system",
      "Up to 500 customers",
      "Basic appointment scheduling",
      "Email support"
    ]
  },
  {
    id: "professional",
    name: "Professional",
    price: 250,
    features: [
      "Up to 2500 customers",
      "AI booking system",
      "Custom training",
      "2000 emails per month",
      "Advanced analytics",
      "Priority support"
    ],
    isPopular: true
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 999,
    features: [
      "Up to 7500 patients",
      "Unlimited AI triage system",
      "Custom training",
      "Multi-location system",
      "7500 emails per month",
      "Dedicated account manager",
      "24/7 Premium support"
    ]
  }
];

export default function Pricing() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubscribe = async (planId: string) => {
    setLoading(true);
    try {
      toast.success("Redirecting to checkout...");
      // Here you would integrate with your payment system
      // For now, just navigate to create business
      navigate("/create-business");
    } catch (error: any) {
      toast.error(error.message || "Failed to start checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-7xl md:text-9xl font-bold mb-4 bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
            PRICING
          </h1>
          <p className="text-muted-foreground text-lg">Choose the perfect plan for your practice</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PLANS.map((plan) => {
            const isPro = plan.isPopular;
            
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
                    <h3 className="text-2xl font-semibold mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold">€{plan.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
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
                    Get Started
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>All plans include free updates and can be cancelled anytime.</p>
        </div>
      </div>
    </div>
  );
}
