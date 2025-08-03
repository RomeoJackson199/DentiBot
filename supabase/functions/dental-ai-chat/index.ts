import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversation_history, user_profile, patient_context, mode } = await req.json();

    console.log('Received request:', { message, user_profile, mode });
    
    // Validate input
    if (!message || typeof message !== 'string') {
      throw new Error('Invalid message format');
    }

    // Simple fallback responses based on message content
    const lowerMessage = message.toLowerCase();
    let fallbackResponse = "I'm here to help you with your dental care. How can I assist you today?";
    let suggestions = [];
    
    if (lowerMessage.includes('douleur') || lowerMessage.includes('pain') || lowerMessage.includes('mal aux dents')) {
      fallbackResponse = "I understand you're experiencing dental pain. I recommend scheduling an appointment with Dr. Firdaws Benhsain who specializes in emergency care and general dentistry.";
      suggestions = ['booking'];
    } else if (lowerMessage.includes('appointment') || lowerMessage.includes('rendez-vous') || lowerMessage.includes('booking')) {
      fallbackResponse = "I can help you book an appointment. Would you like me to recommend a dentist based on your needs?";
      suggestions = ['recommend-dentist'];
    } else if (lowerMessage.includes('dentist') || lowerMessage.includes('dentiste')) {
      fallbackResponse = "I can recommend a dentist based on your specific needs. What type of dental care are you looking for?";
      suggestions = ['recommend-dentist'];
    } else if (lowerMessage.includes('cleaning') || lowerMessage.includes('nettoyage') || lowerMessage.includes('routine')) {
      fallbackResponse = "For routine cleaning, I recommend Dr. Firdaws Benhsain who provides excellent general dental care.";
      suggestions = ['booking'];
    } else if (lowerMessage.includes('child') || lowerMessage.includes('enfant') || lowerMessage.includes('kid')) {
      fallbackResponse = "For pediatric care, I recommend Dr. Virginie Pauwels who specializes in children's dentistry.";
      suggestions = ['booking'];
    } else if (lowerMessage.includes('braces') || lowerMessage.includes('orthodontie') || lowerMessage.includes('align')) {
      fallbackResponse = "For orthodontic treatment, I recommend Dr. Justine Peters who specializes in braces and teeth alignment.";
      suggestions = ['booking'];
    }
    
    return new Response(JSON.stringify({ 
      response: fallbackResponse,
      suggestions,
      urgency_detected: false,
      emergency_detected: false,
      recommended_dentist: [],
      consultation_reason: "General consultation"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in dental-ai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: 'An error occurred. Please try again.',
      fallback_response: "I'm sorry, I'm experiencing a technical issue. For a dental emergency, please contact the office directly or emergency services."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});