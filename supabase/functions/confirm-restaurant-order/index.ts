import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    // Create client with user's token for proper RLS
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    const { orderId } = await req.json();

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('restaurant_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;

    // Update order status to confirmed (sends to kitchen)
    const { error: updateError } = await supabase
      .from('restaurant_orders')
      .update({
        order_status: 'confirmed',
      })
      .eq('id', orderId);

    if (updateError) throw updateError;

    // Update all order items to pending (ready for kitchen)
    const { error: itemsError } = await supabase
      .from('order_items')
      .update({
        item_status: 'pending',
      })
      .eq('order_id', orderId)
      .eq('item_status', 'pending'); // Only update pending items

    if (itemsError) throw itemsError;

    console.log(`Order ${orderId} confirmed and sent to kitchen`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Order confirmed and sent to kitchen',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error confirming order:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
