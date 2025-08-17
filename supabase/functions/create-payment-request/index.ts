import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Invalid or expired token');
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Stripe secret key not configured");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const { patient_id, dentist_id, amount, description, patient_email, patient_name, payment_request_id } = await req.json();

    // Authorization check: Only dentists can create payment requests
    if (dentist_id) {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const { data: dentist, error: dentistError } = await supabaseClient
        .from('dentists')
        .select('id')
        .eq('id', dentist_id)
        .eq('profile_id', profile?.id)
        .single();

      if (dentistError || !dentist) {
        throw new Error('Unauthorized: Only the dentist can create payment requests');
      }
    }

    // If payment_request_id is provided, get existing payment request
    if (payment_request_id) {
      const { data: paymentRequest, error } = await supabaseClient
        .from('payment_requests')
        .select('*')
        .eq('id', payment_request_id)
        .single();

      if (error) throw new Error("Payment request not found");

      // Verify user owns this payment request (either as dentist or patient)
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const isDentist = await supabaseClient
        .from('dentists')
        .select('id')
        .eq('id', paymentRequest.dentist_id)
        .eq('profile_id', profile?.id)
        .single();

      const isPatient = paymentRequest.patient_id === profile?.id;

      if (!isDentist.data && !isPatient) {
        throw new Error('Unauthorized: You can only access your own payment requests');
      }

      // Create new Stripe session for existing payment request
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: paymentRequest.description,
              },
              unit_amount: paymentRequest.amount,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get("origin")}/payment-cancelled`,
        customer_email: paymentRequest.patient_email,
        metadata: {
          patient_id: paymentRequest.patient_id,
          dentist_id: paymentRequest.dentist_id,
          payment_request_id: payment_request_id,
          description: paymentRequest.description,
        },
      });

      // Update payment request with new session ID
      await supabaseClient
        .from('payment_requests')
        .update({ stripe_session_id: session.id })
        .eq('id', payment_request_id);

      return new Response(
        JSON.stringify({ 
          payment_url: session.url,
          session_id: session.id,
          message: "Payment link created successfully"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (!patient_id || !dentist_id || !amount || !description || !patient_email) {
      throw new Error("Missing required fields");
    }

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: description,
            },
            unit_amount: amount, // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/payment-cancelled`,
      customer_email: patient_email,
      metadata: {
        patient_id,
        dentist_id,
        description,
      },
    });

    // Save payment request to database for tracking and return its id
    const { data: inserted, error: insertError } = await supabaseClient
      .from("payment_requests")
      .insert({
        patient_id,
        dentist_id,
        amount,
        description,
        stripe_session_id: session.id,
        patient_email,
        status: "pending",
      })
      .select('id')
      .single();

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        payment_url: session.url,
        session_id: session.id,
        payment_request_id: inserted?.id,
        message: "Payment request created successfully"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating payment request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});