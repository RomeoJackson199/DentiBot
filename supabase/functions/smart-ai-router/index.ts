import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Dental-related keywords and patterns
const DENTAL_KEYWORDS = [
  // English
  'tooth', 'teeth', 'dental', 'dentist', 'dentistry', 'toothache', 'pain', 'cavity', 'filling',
  'cleaning', 'hygiene', 'braces', 'orthodontics', 'appointment', 'checkup', 'extraction',
  'root canal', 'crown', 'bridge', 'implant', 'gum', 'gingivitis', 'periodontal',
  'whitening', 'bleaching', 'sensitive', 'decay', 'plaque', 'tartar', 'floss', 'brush',
  
  // French
  'dent', 'dents', 'dentaire', 'dentiste', 'dentisterie', 'mal aux dents', 'cavité',
  'plombage', 'nettoyage', 'hygiène', 'appareil', 'orthodontie', 'rendez-vous',
  'consultation', 'extraction', 'couronne', 'pont', 'implant', 'gencive', 'gingivite',
  'parodontal', 'blanchiment', 'sensible', 'carie', 'plaque', 'tartre', 'fil dentaire',
  
  // Dutch
  'tand', 'tanden', 'tandheelkunde', 'tandarts', 'tandpijn', 'caviteit', 'vulling',
  'reiniging', 'hygiëne', 'beugel', 'orthodontie', 'afspraak', 'controle', 'extractie',
  'kroon', 'brug', 'implant', 'tandvlees', 'gingivitis', 'parodontaal', 'bleken',
  'gevoelig', 'cariës', 'plaque', 'tandsteen', 'flossen', 'poetsen'
];

// Function to detect if a message is dental-related
function isDentalRelated(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  
  // Check for dental keywords
  const hasDentalKeywords = DENTAL_KEYWORDS.some(keyword => 
    lowerMessage.includes(keyword.toLowerCase())
  );
  
  // Check for specific dental patterns
  const dentalPatterns = [
    /(tooth|dent|tand)(ache|pain|pijn)/i,
    /(dental|dentaire|tandheelkundige?)\s+(care|soins|zorg)/i,
    /(appointment|rendez-vous|afspraak)\s+(with|avec|met)\s+(dentist|dentiste|tandarts)/i,
    /(need|besoin|nodig)\s+(a|une|een)\s+(dentist|dentiste|tandarts)/i,
    /(cleaning|nettoyage|reiniging)/i,
    /(braces|appareil|beugel)/i
  ];
  
  const matchesDentalPattern = dentalPatterns.some(pattern => pattern.test(message));
  
  return hasDentalKeywords || matchesDentalPattern;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversation_history, user_profile, patient_context, mode } = await req.json();

    console.log('Received smart router request:', { message, user_profile, mode });
    
    // Validate input
    if (!message || typeof message !== 'string') {
      throw new Error('Invalid message format');
    }

    // Detect if the message is dental-related
    const isDental = isDentalRelated(message);
    console.log('Message classification:', { message, isDental });

    // Route to appropriate AI function
    const targetFunction = isDental ? 'dental-ai-chat' : 'general-ai-chat';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://gjvxcisbaxhhblhsytar.supabase.co';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqdnhjaXNiYXhoaGJsaHN5dGFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjU4MDUsImV4cCI6MjA2NzY0MTgwNX0.p4HO2McB5IqP9iQ_p_Z6yHKCkKyDXuIm7ono6UJZcmM';

    // Call the appropriate AI function
    const response = await fetch(`${supabaseUrl}/functions/v1/${targetFunction}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversation_history,
        user_profile,
        patient_context,
        mode
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${targetFunction} error:`, response.status, errorText);
      throw new Error(`${targetFunction} error: ${response.status}`);
    }

    const data = await response.json();
    
    // Add routing information to the response
    return new Response(JSON.stringify({
      ...data,
      routed_to: targetFunction,
      is_dental: isDental
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in smart-ai-router function:', error);
    return new Response(JSON.stringify({
      error: 'An error occurred while processing your request.',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});