import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, serviceKey);

    const { payment_request_ids, template_key, dentist_id } = await req.json();
    if (!Array.isArray(payment_request_ids) || payment_request_ids.length === 0) {
      throw new Error('payment_request_ids required');
    }

    // Fetch payment requests
    const { data: requests, error } = await supabase
      .from('payment_requests')
      .select('id, patient_email, description, amount, status, patient_id, dentist_id, stripe_session_id')
      .in('id', payment_request_ids);
    if (error) throw error;

    const results: Record<string, { ok: boolean; message?: string }> = {};

    if (!requests || requests.length === 0) {
      return new Response(JSON.stringify({ success: true, results: {} }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    for (const pr of (requests || [])) {
      try {
        // Compose copy
        const subject = template_key === 'firm'
          ? `Reminder: invoice #${pr.id} is past due`
          : `Payment reminder from your dentist`;
        const link = pr.stripe_session_id ? `${supabaseUrl}/functions/v1/create-payment-request?payment_request_id=${pr.id}` : '';
        const message = template_key === 'firm'
          ? `A quick reminder: invoice #${pr.id} is now past due. You can pay securely here: ${link}.`
          : `Thanks for your visit. Your payment link is below.\n\nPay securely here: ${link}`;

        // Send via system email function
        const fnUrl = `${supabaseUrl}/functions/v1/send-email-notification`;
        await fetch(fnUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceKey}`
          },
          body: JSON.stringify({
            to: pr.patient_email,
            subject,
            message,
            messageType: 'system',
            isSystemNotification: true,
            patientId: pr.patient_id,
            dentistId: pr.dentist_id,
          })
        });

        await supabase
          .from('payment_reminders')
          .insert({
            payment_request_id: pr.id,
            template_key: template_key || 'friendly',
            channel: 'email',
            status: 'sent',
            sent_at: new Date().toISOString(),
            metadata: { subject }
          });

        await supabase
          .from('payment_requests')
          .update({ last_reminder_at: new Date().toISOString() })
          .eq('id', pr.id);

        results[pr.id] = { ok: true };
      } catch (e) {
        results[pr.id] = { ok: false, message: (e as Error).message };
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

