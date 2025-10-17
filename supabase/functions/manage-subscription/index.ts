import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    });

    const { action, organization_id, tier, billing_interval } = await req.json();

    // Get organization
    const { data: org, error: orgError } = await supabaseClient
      .from('organizations')
      .select('*, organization_settings(*)')
      .eq('id', organization_id)
      .single();

    if (orgError || !org) {
      throw new Error('Organization not found');
    }

    // Get subscription plan
    const { data: plan } = await supabaseClient
      .from('subscription_plans')
      .select('*')
      .eq('name', tier)
      .single();

    if (!plan) {
      throw new Error('Subscription plan not found');
    }

    let result;

    if (action === 'create') {
      // Create or get Stripe customer
      let customerId = org.stripe_customer_id;
      
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: org.organization_settings?.[0]?.contact_email || '',
          name: org.name,
          metadata: { organization_id: org.id },
        });
        customerId = customer.id;

        // Update organization with customer ID
        await supabaseClient
          .from('organizations')
          .update({ stripe_customer_id: customerId })
          .eq('id', organization_id);
      }

      // Create subscription
      const priceId = billing_interval === 'yearly' 
        ? plan.stripe_price_id_yearly 
        : plan.stripe_price_id_monthly;

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata: { organization_id: org.id },
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      // Update organization subscription status
      await supabaseClient
        .from('organizations')
        .update({
          stripe_subscription_id: subscription.id,
          subscription_tier: tier,
          subscription_status: 'active',
          trial_ends_at: null,
        })
        .eq('id', organization_id);

      result = { subscription, client_secret: (subscription.latest_invoice as any).payment_intent.client_secret };

    } else if (action === 'update') {
      if (!org.stripe_subscription_id) {
        throw new Error('No active subscription found');
      }

      // Update subscription
      const subscription = await stripe.subscriptions.retrieve(org.stripe_subscription_id);
      const priceId = billing_interval === 'yearly' 
        ? plan.stripe_price_id_yearly 
        : plan.stripe_price_id_monthly;

      const updatedSubscription = await stripe.subscriptions.update(org.stripe_subscription_id, {
        items: [{
          id: subscription.items.data[0].id,
          price: priceId,
        }],
        proration_behavior: 'always_invoice',
      });

      // Update organization
      await supabaseClient
        .from('organizations')
        .update({
          subscription_tier: tier,
        })
        .eq('id', organization_id);

      result = { subscription: updatedSubscription };

    } else if (action === 'cancel') {
      if (!org.stripe_subscription_id) {
        throw new Error('No active subscription found');
      }

      // Cancel at period end
      const subscription = await stripe.subscriptions.update(org.stripe_subscription_id, {
        cancel_at_period_end: true,
      });

      // Update organization
      await supabaseClient
        .from('organizations')
        .update({
          subscription_status: 'canceling',
        })
        .eq('id', organization_id);

      result = { subscription };

    } else if (action === 'reactivate') {
      if (!org.stripe_subscription_id) {
        throw new Error('No active subscription found');
      }

      // Reactivate subscription
      const subscription = await stripe.subscriptions.update(org.stripe_subscription_id, {
        cancel_at_period_end: false,
      });

      // Update organization
      await supabaseClient
        .from('organizations')
        .update({
          subscription_status: 'active',
        })
        .eq('id', organization_id);

      result = { subscription };
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error managing subscription:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
