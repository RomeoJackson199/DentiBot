import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TransactionalEmailRequest {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
  metadata: {
    event_type: string;
    patient_id: string;
    appointment_id?: string;
    template_id: string;
    idempotency_key: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody: TransactionalEmailRequest = await req.json();
    
    console.log("Processing transactional email:", {
      to: requestBody.to,
      event_type: requestBody.metadata.event_type,
      idempotency_key: requestBody.metadata.idempotency_key
    });

    // Prepare attachments for Resend
    const attachments = requestBody.attachments?.map(att => ({
      filename: att.filename,
      content: Buffer.from(att.content).toString('base64'),
      type: att.contentType
    }));

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Dental Clinic <noreply@resend.dev>", // Use verified domain in production
      to: [requestBody.to],
      subject: requestBody.subject,
      html: requestBody.html,
      attachments: attachments,
      headers: {
        'X-Event-Type': requestBody.metadata.event_type,
        'X-Patient-ID': requestBody.metadata.patient_id,
        'X-Idempotency-Key': requestBody.metadata.idempotency_key
      }
    });

    if (emailResponse.error) {
      console.error("Resend API error:", emailResponse.error);
      throw new Error(`Failed to send email: ${emailResponse.error.message}`);
    }

    console.log("Email sent successfully:", {
      id: emailResponse.data?.id,
      to: requestBody.to,
      event_type: requestBody.metadata.event_type
    });

    return new Response(JSON.stringify({
      success: true,
      message_id: emailResponse.data?.id,
      event_type: requestBody.metadata.event_type,
      patient_id: requestBody.metadata.patient_id
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-transactional-email function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Unknown error occurred",
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);