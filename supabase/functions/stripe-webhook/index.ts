import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  
  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Webhook event type:', event.type);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const organizationId = subscription.metadata.organization_id;

        if (organizationId) {
          await supabaseClient
            .from('organizations')
            .update({
              stripe_subscription_id: subscription.id,
              subscription_status: subscription.status as any,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('id', organizationId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const organizationId = subscription.metadata.organization_id;

        if (organizationId) {
          await supabaseClient
            .from('organizations')
            .update({
              subscription_status: 'canceled',
              subscription_tier: 'free',
              stripe_subscription_id: null,
            })
            .eq('id', organizationId);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription = invoice.subscription;

        if (subscription && typeof subscription === 'string') {
          const { data: org } = await supabaseClient
            .from('organizations')
            .select('id')
            .eq('stripe_subscription_id', subscription)
            .single();

          if (org) {
            await supabaseClient
              .from('organizations')
              .update({
                subscription_status: 'active',
                last_payment_date: new Date().toISOString(),
              })
              .eq('id', org.id);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription = invoice.subscription;

        if (subscription && typeof subscription === 'string') {
          const { data: org } = await supabaseClient
            .from('organizations')
            .select('id')
            .eq('stripe_subscription_id', subscription)
            .single();

          if (org) {
            await supabaseClient
              .from('organizations')
              .update({
                subscription_status: 'past_due',
              })
              .eq('id', org.id);
          }
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
