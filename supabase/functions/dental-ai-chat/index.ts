import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversation_history, user_profile } = await req.json();

    console.log('Received request:', { message, user_profile });

    const assistantPersona = `
You are DentiBot, a professional dental virtual assistant.
`;

const consultationGuidelines = `
IMPORTANT INSTRUCTIONS:
- Maintain a professional and courteous tone
- Conduct thorough consultations before recommendations
- Ask relevant follow-up questions to understand the patient's needs
- Do NOT immediately recommend dentists - conduct proper assessment first
- Provide medical guidance only when explicitly requested
- Show empathy while maintaining professionalism
- Inquire about symptoms, onset, severity, and related factors
- Build rapport professionally before suggesting next steps
`;

const dentistDirectory = `
AVAILABLE DENTISTS:
Dr. Virginie Pauwels - Pédodontiste (Pediatric Dentistry)
Dr. Emeline Hubin - Pédodontiste (Pediatric Dentistry)
Dr. Firdaws Benhsain - Dentiste généraliste (General Dentistry)
Dr. Justine Peters - Orthodontiste (Orthodontics)
Dr. Anne-Sophie Haas - Orthodontiste (Orthodontics)
`;

const consultationFlow = `
CONSULTATION FLOW:
1. Professional greeting and inquiry
2. Listen carefully to patient concerns
3. Ask diagnostic questions (onset, severity, triggers, duration)
4. Provide empathetic acknowledgment
5. Recommend appropriate specialist only after full assessment
6. If a photo is submitted: "Photo received and will be reviewed by the dentist."
`;

const languageExamples = `
PROFESSIONAL LANGUAGE EXAMPLES:
- "Good day. How may I assist you with your dental concerns today?"
- "I understand this must be concerning for you. Could you tell me when these symptoms first appeared?"
- "Thank you for providing that information. Could you describe the intensity of the discomfort?"
- "Based on your symptoms, I would recommend Dr. [Name] who specializes in this area."
`;

const userInfo = `Patient Information: ${JSON.stringify(user_profile)}`;
const convoHistory = `Conversation History:\n${conversation_history.map((msg: any) => (msg.is_bot ? 'Assistant' : 'Patient') + ': ' + msg.message).join('\n')}`;

const systemPrompt = [
  assistantPersona,
  consultationGuidelines,
  dentistDirectory,
  consultationFlow,
  languageExamples,
  userInfo,
  convoHistory
].join('\n');

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversation_history.map((msg: any) => ({
        role: msg.is_bot ? 'assistant' : 'user',
        content: msg.message
      })),
      { role: 'user', content: message }
    ];

    console.log('Sending to OpenAI:', { messageCount: messages.length });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + openAIApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error('OpenAI API error: ' + response.status);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    const botResponse = data.choices[0].message.content;

    // Simple keyword-based suggestions and recommendations
    const suggestions = [];
    const lowerResponse = botResponse.toLowerCase();
    
    // Extract dentist recommendations from response
    let recommendedDentist = null;
    if (lowerResponse.includes('virginie pauwels')) recommendedDentist = 'Virginie Pauwels';
    else if (lowerResponse.includes('emeline hubin')) recommendedDentist = 'Emeline Hubin';
    else if (lowerResponse.includes('firdaws benhsain')) recommendedDentist = 'Firdaws Benhsain';
    else if (lowerResponse.includes('justine peters')) recommendedDentist = 'Justine Peters';
    else if (lowerResponse.includes('anne-sophie haas')) recommendedDentist = 'Anne-Sophie Haas';
    
    // Suggest booking after recommendation
    if (recommendedDentist || lowerResponse.includes('dentist') || 
        lowerResponse.includes('appointment') || lowerResponse.includes('booking')) {
      suggestions.push('booking');
    }
    
    // Detect urgency indicators
    const urgencyKeywords = ['urgent', 'quickly', 'fast', 'now', 'today', 'emergency'];
    const urgency_detected = urgencyKeywords.some(keyword => lowerResponse.includes(keyword));

    return new Response(JSON.stringify({ 
      response: botResponse,
      suggestions,
      urgency_detected,
      recommended_dentist: recommendedDentist
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