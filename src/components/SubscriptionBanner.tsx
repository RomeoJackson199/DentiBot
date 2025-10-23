import { useEffect, useState } from "react";
import { AlertCircle, Crown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { differenceInDays } from "date-fns";

interface Subscription {
  id: string;
  status: string;
  billing_cycle: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  subscription_plans: {
    name: string;
  };
}

export function SubscriptionBanner({ dentistId }: { dentistId: string }) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubscription = async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select(`
          *,
          subscription_plans (name)
        `)
        .eq('dentist_id', dentistId)
        .single();

      setSubscription(data as any);
    };

    fetchSubscription();
  }, [dentistId]);

  if (dismissed) return null;

  // No subscription - show upgrade banner
  if (!subscription) {
    return (
      <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-l-4 border-primary p-4 mb-6 rounded-lg">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-start gap-3">
          <Crown className="w-5 h-5 text-primary mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Unlock Premium Features</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Get access to advanced analytics, priority support, and unlimited patients with our Pro or Enterprise plan.
            </p>
            <Button
              onClick={() => navigate('/pricing')}
              size="sm"
              className="bg-gradient-to-r from-primary to-primary-glow"
            >
              View Pricing
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Check if subscription is expiring soon
  const daysUntilExpiry = differenceInDays(
    new Date(subscription.current_period_end),
    new Date()
  );

  // Show renewal reminder if less than 7 days
  if (daysUntilExpiry <= 7 && daysUntilExpiry >= 0 && !subscription.cancel_at_period_end) {
    return (
      <div className="relative bg-gradient-to-r from-warning/10 via-warning/5 to-transparent border-l-4 border-warning p-4 mb-6 rounded-lg">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Subscription Renewal</h3>
            <p className="text-sm text-muted-foreground">
              Your {subscription.subscription_plans.name} plan will renew in {daysUntilExpiry} days.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show cancellation warning
  if (subscription.cancel_at_period_end) {
    return (
      <div className="relative bg-gradient-to-r from-destructive/10 via-destructive/5 to-transparent border-l-4 border-destructive p-4 mb-6 rounded-lg">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Subscription Ending</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Your subscription will end on {new Date(subscription.current_period_end).toLocaleDateString()}. 
              Reactivate to continue enjoying premium features.
            </p>
            <Button
              onClick={() => navigate('/pricing')}
              size="sm"
              variant="destructive"
            >
              Reactivate
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
