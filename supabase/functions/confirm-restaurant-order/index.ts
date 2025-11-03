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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth token to verify user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization required');
    }

    // Create client with user token to check permissions
    const userSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { orderId } = await req.json();

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    // Get order details and verify user has access
    const { data: order, error: orderError } = await supabase
      .from('restaurant_orders')
      .select('*, business_id')
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;
    if (!order) throw new Error('Order not found');

    // Verify user is staff member of the business
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Profile lookup error:', profileError);
      throw new Error('Profile lookup failed');
    }
    
    if (!profile) {
      console.error('Profile not found for user:', user.id);
      throw new Error('Profile not found');
    }

    const { data: staffRole, error: staffError } = await supabase
      .from('restaurant_staff_roles')
      .select('role')
      .eq('business_id', order.business_id)
      .eq('profile_id', profile.id)
      .eq('is_active', true)
      .maybeSingle();

    if (staffError) {
      console.error('Staff role lookup error:', staffError);
      throw new Error('Staff role lookup failed');
    }

    if (!staffRole) {
      console.error(`User ${user.email} (profile: ${profile.id}) not authorized for business ${order.business_id}`);
      throw new Error('Not authorized to confirm orders for this business');
    }

    console.log(`User ${user.email} (${staffRole.role}) confirming order ${orderId}`);

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
