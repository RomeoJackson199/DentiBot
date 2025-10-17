import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Sparkles, Zap, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface SubscriptionManagerProps {
  organizationId: string;
}

export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ organizationId }) => {
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const queryClient = useQueryClient();

  const { data: organization } = useQuery({
    queryKey: ['organization', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: plans } = useQuery({
    queryKey: ['subscription_plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const updateSubscription = useMutation({
    mutationFn: async ({ tier, action }: { tier: string; action: string }) => {
      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        body: { 
          action, 
          organization_id: organizationId, 
          tier,
          billing_interval: billingInterval 
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', organizationId] });
      toast.success('Subscription updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update subscription: ' + error.message);
    },
  });

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'free': return <Sparkles className="h-5 w-5" />;
      case 'starter': return <Zap className="h-5 w-5" />;
      case 'professional': return <Crown className="h-5 w-5" />;
      case 'enterprise': return <Crown className="h-5 w-5 text-amber-500" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      trialing: 'secondary',
      past_due: 'destructive',
      canceled: 'outline',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Subscription</CardTitle>
          <CardDescription>Manage your organization's subscription plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {organization && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getTierIcon(organization.subscription_tier)}
                <div>
                  <p className="font-semibold capitalize">{organization.subscription_tier} Plan</p>
                  <p className="text-sm text-muted-foreground">
                    {organization.is_demo ? 'Demo Mode' : getStatusBadge(organization.subscription_status)}
                  </p>
                </div>
              </div>
              {organization.current_period_end && (
                <p className="text-sm text-muted-foreground">
                  Renews {new Date(organization.current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-4 mb-6">
        <RadioGroup value={billingInterval} onValueChange={(v) => setBillingInterval(v as any)}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="monthly" id="monthly" />
            <Label htmlFor="monthly">Monthly</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yearly" id="yearly" />
            <Label htmlFor="yearly">Yearly (Save 20%)</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans?.map((plan) => {
          const price = billingInterval === 'yearly' ? plan.price_yearly : plan.price_monthly;
          const isCurrentPlan = organization?.subscription_tier === plan.name;
          const features = plan.features as any;

          return (
            <Card key={plan.id} className={isCurrentPlan ? 'border-primary' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="capitalize flex items-center gap-2">
                    {getTierIcon(plan.name)}
                    {plan.name}
                  </CardTitle>
                  {isCurrentPlan && <Badge>Current</Badge>}
                </div>
                <CardDescription className="text-3xl font-bold">
                  ${price}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{billingInterval === 'yearly' ? 'year' : 'month'}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {features?.max_users && (
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">
                        {features.max_users === 999999 ? 'Unlimited' : features.max_users} users
                      </span>
                    </li>
                  )}
                  {features?.max_monthly_bookings && (
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">
                        {features.max_monthly_bookings === 999999 ? 'Unlimited' : features.max_monthly_bookings} bookings/mo
                      </span>
                    </li>
                  )}
                  {features?.ai_chat && (
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">AI Assistant</span>
                    </li>
                  )}
                  {features?.custom_branding && (
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Custom Branding</span>
                    </li>
                  )}
                  {features?.priority_support && (
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Priority Support</span>
                    </li>
                  )}
                  {!features?.priority_support && (
                    <li className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Priority Support</span>
                    </li>
                  )}
                </ul>

                <Button
                  className="w-full"
                  variant={isCurrentPlan ? 'outline' : 'default'}
                  disabled={isCurrentPlan || updateSubscription.isPending}
                  onClick={() => {
                    const action = organization?.stripe_subscription_id ? 'update' : 'create';
                    updateSubscription.mutate({ tier: plan.name, action });
                  }}
                >
                  {updateSubscription.isPending ? 'Processing...' : 
                   isCurrentPlan ? 'Current Plan' : 
                   organization?.stripe_subscription_id ? 'Switch to this plan' : 'Get Started'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {organization?.subscription_status === 'active' && organization?.stripe_subscription_id && (
        <Card>
          <CardHeader>
            <CardTitle>Manage Subscription</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => updateSubscription.mutate({ 
                tier: organization.subscription_tier, 
                action: 'cancel' 
              })}
              disabled={updateSubscription.isPending}
            >
              Cancel Subscription
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
