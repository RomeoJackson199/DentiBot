import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const { email = 'test@example.com' } = await req.json().catch(() => ({}));

    console.log('Testing email send to:', email);

    // Test sending email directly
    const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-transactional-email', {
      body: {
        to: email,
        subject: 'Test Email from Dental System',
        html: `
          <h2>Email Test Successful!</h2>
          <p>This is a test email from your dental system.</p>
          <p>If you received this, the email system is working correctly.</p>
        `,
        metadata: {
          event_type: 'test_email',
          patient_id: 'test-patient-id',
          template_id: 'test_email_template',
          idempotency_key: `test_${Date.now()}`
        }
      }
    });

    if (emailError) {
      console.error('Email test failed:', emailError);
      return new Response(JSON.stringify({
        success: false,
        error: emailError.message,
        details: emailError
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Email test successful:', emailResult);

    return new Response(JSON.stringify({
      success: true,
      message: 'Test email sent successfully',
      result: emailResult
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in test-email function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});