import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  userId: string;
  chatSummary: string;
  photoUrl?: string;
  appointmentData?: any;
  urgencyLevel?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, chatSummary, photoUrl, appointmentData, urgencyLevel }: EmailRequest = await req.json();
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get patient profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error('Patient profile not found');
    }

    // Generate 6-digit patient ID based on profile ID
    const patientId = profile.id.slice(-6).toUpperCase();

    // Check if this is the first email for this patient
    const { data: existingEmails, error: emailError } = await supabase
      .from('chat_messages')
      .select('id')
      .eq('user_id', userId)
      .eq('message_type', 'email_sent')
      .limit(1);

    const isFirstEmail = !existingEmails || existingEmails.length === 0;

    // Prepare email content
    let emailContent = `
      <h2>Résumé de consultation dentaire - Patient ID: ${patientId}</h2>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Résumé de la conversation:</h3>
        <p style="white-space: pre-wrap;">${chatSummary}</p>
      </div>
    `;

    if (isFirstEmail) {
      emailContent += `
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Informations du patient (première consultation):</h3>
          <ul>
            <li><strong>Nom:</strong> ${profile.first_name} ${profile.last_name}</li>
            <li><strong>Email:</strong> ${profile.email}</li>
            <li><strong>Téléphone:</strong> ${profile.phone || 'Non fourni'}</li>
            <li><strong>Date de naissance:</strong> ${profile.date_of_birth || 'Non fournie'}</li>
            <li><strong>Historique médical:</strong> ${profile.medical_history || 'Aucun'}</li>
            <li><strong>Langue préférée:</strong> ${profile.preferred_language || 'Français'}</li>
          </ul>
        </div>
      `;
    }

    if (urgencyLevel) {
      emailContent += `
        <div style="background: ${urgencyLevel === 'emergency' ? '#ffebee' : urgencyLevel === 'high' ? '#fff3e0' : '#f3e5f5'}; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Niveau d'urgence: ${urgencyLevel.toUpperCase()}</h3>
          <p>Ce patient nécessite une attention particulière.</p>
        </div>
      `;
    }

    if (appointmentData) {
      emailContent += `
        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Demande de rendez-vous:</h3>
          <ul>
            <li><strong>Date souhaitée:</strong> ${appointmentData.date}</li>
            <li><strong>Heure:</strong> ${appointmentData.time}</li>
            <li><strong>Raison:</strong> ${appointmentData.reason}</li>
            <li><strong>Notes:</strong> ${appointmentData.notes || 'Aucune'}</li>
          </ul>
        </div>
      `;
    }

    if (photoUrl) {
      emailContent += `
        <div style="margin: 20px 0;">
          <h3>Photo jointe:</h3>
          <img src="${photoUrl}" alt="Photo du patient" style="max-width: 400px; border-radius: 8px;" />
        </div>
      `;
    }

    emailContent += `
      <hr style="margin: 30px 0;" />
      <p style="color: #666; font-size: 12px;">
        Email automatique généré par DentiBot AI<br/>
        Patient ID: ${patientId} | Date: ${new Date().toLocaleString('fr-FR')}
      </p>
    `;

    // Send email
    const emailResponse = await resend.emails.send({
      from: "DentiBot AI <onboarding@resend.dev>",
      to: ["dental.ai.jackson@gmail.com"],
      subject: `${isFirstEmail ? '[NOUVEAU PATIENT]' : '[SUIVI]'} Patient ${patientId} - ${profile.first_name} ${profile.last_name}`,
      html: emailContent,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log the email in chat_messages
    await supabase
      .from('chat_messages')
      .insert({
        user_id: userId,
        session_id: crypto.randomUUID(),
        message: `Email envoyé au dentiste avec le résumé de consultation (Patient ID: ${patientId})`,
        is_bot: true,
        message_type: 'email_sent',
        metadata: { email_id: emailResponse.data?.id, patient_id: patientId }
      });

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id,
      patientId 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-patient-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);