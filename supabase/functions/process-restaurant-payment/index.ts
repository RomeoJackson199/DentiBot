import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    const { orderId, returnUrl } = await req.json();

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('restaurant_orders')
      .select(`
        *,
        order_items (
          *,
          business_services (name)
        ),
        restaurant_tables (table_number),
        table_reservations (
          appointments (
            profiles (first_name, last_name, email)
          )
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;

    // Create line items for Stripe
    const lineItems = order.order_items.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.business_services?.name || 'Menu Item',
          description: item.special_instructions || undefined,
        },
        unit_amount: item.unit_price_cents,
      },
      quantity: item.quantity,
    }));

    // Add tax as a line item if applicable
    if (order.tax_cents > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Tax',
          },
          unit_amount: order.tax_cents,
        },
        quantity: 1,
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${returnUrl}?cancelled=true`,
      customer_email: order.table_reservations?.appointments?.profiles?.email,
      metadata: {
        order_id: orderId,
        business_id: order.business_id,
        table_number: order.restaurant_tables?.table_number || 'Unknown',
      },
    });

    // Update order with payment session ID
    const { error: updateError } = await supabase
      .from('restaurant_orders')
      .update({
        order_status: 'ready_for_payment',
      })
      .eq('id', orderId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        sessionId: session.id,
        url: session.url,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing payment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
