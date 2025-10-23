import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { planId, billingCycle } = await req.json();

    if (!planId || !billingCycle) {
      throw new Error('Plan ID and billing cycle are required');
    }

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get user's profile and dentist info
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      throw new Error('Profile not found');
    }

    const { data: dentist } = await supabase
      .from('dentists')
      .select('id, email, first_name, last_name')
      .eq('profile_id', profile.id)
      .single();

    if (!dentist) {
      throw new Error('Dentist profile not found');
    }

    // Get plan details
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (!plan) {
      throw new Error('Plan not found');
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Create or get Stripe customer
    let customerId: string;
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('dentist_id', dentist.id)
      .single();

    if (existingSub?.stripe_customer_id) {
      customerId = existingSub.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: dentist.email || user.email,
        name: `${dentist.first_name} ${dentist.last_name}`,
        metadata: {
          dentist_id: dentist.id,
          user_id: user.id,
        },
      });
      customerId = customer.id;
    }

    // Determine price
    const price = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
    const interval = billingCycle === 'yearly' ? 'year' : 'month';

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${plan.name} Plan`,
              description: `DentiBot ${plan.name} subscription`,
            },
            unit_amount: Math.round(price * 100), // Convert to cents
            recurring: {
              interval: interval,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${req.headers.get('origin')}/dentist?subscription=success`,
      cancel_url: `${req.headers.get('origin')}/pricing?cancelled=true`,
      metadata: {
        dentist_id: dentist.id,
        plan_id: planId,
        billing_cycle: billingCycle,
      },
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
