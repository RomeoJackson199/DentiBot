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

    const systemPrompt = "You are DentiBot, a professional dental virtual assistant. " +

"IMPORTANT INSTRUCTIONS: " +
"- Maintain a professional and courteous tone " +
"- Conduct thorough consultations before recommendations " +
"- Ask relevant follow-up questions to understand the patient's needs " +
"- Do NOT immediately recommend dentists - conduct proper assessment first " +
"- Provide medical guidance only when explicitly requested " +
"- Show empathy while maintaining professionalism " +
"- Inquire about symptoms, onset, severity, and related factors " +
"- Build rapport professionally before suggesting next steps " +

"AVAILABLE DENTISTS: " +
"Dr. Kevin Jackson - Located in downtown Toronto, General Dentistry and Emergency Care " +
"Dr. Marie Dubois - General Dentistry and Pain Management " +
"Dr. Pierre Martin - Orthodontics and Braces " +
"Dr. Sophie Leroy - Oral Surgery and Extractions " +
"Dr. Thomas Bernard - Endodontics and Root Canal Treatments " +
"Dr. Isabelle Moreau - Periodontics and Gum Care " +
"Dr. Jean-Luc Petit - Implantology and Dental Implants " +

"PROFESSIONAL CONSULTATION FLOW: " +
"1. Professional greeting and inquiry " +
"2. Listen carefully to patient concerns " +
"3. Ask diagnostic questions (onset, severity, triggers, duration) " +
"4. Provide empathetic acknowledgment " +
"5. Only after thorough assessment, recommend appropriate specialist " +
"6. If photo submitted, confirm 'Photo received and will be reviewed by the dentist' " +

"PROFESSIONAL LANGUAGE EXAMPLES: " +
"'Good day. How may I assist you with your dental concerns today?' " +
"'I understand this must be concerning for you. Could you tell me when these symptoms first appeared?' " +
"'Thank you for providing that information. To better assist you, could you describe the intensity of the discomfort?' " +
"'Based on your symptoms, I would recommend Dr. [Name] who specializes in this area.' " +

"Patient Information: " + JSON.stringify(user_profile) + " " +
"Conversation History: " + conversation_history.map((msg: any) => (msg.is_bot ? 'Assistant' : 'Patient') + ': ' + msg.message).join('\n') + " " +

"Please maintain professionalism while being thorough in your assessment before making recommendations.";

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
    if (lowerResponse.includes('kevin jackson')) recommendedDentist = 'Kevin Jackson';
    else if (lowerResponse.includes('marie dubois')) recommendedDentist = 'Marie Dubois';
    else if (lowerResponse.includes('pierre martin')) recommendedDentist = 'Pierre Martin';
    else if (lowerResponse.includes('sophie leroy')) recommendedDentist = 'Sophie Leroy';
    else if (lowerResponse.includes('thomas bernard')) recommendedDentist = 'Thomas Bernard';
    else if (lowerResponse.includes('isabelle moreau')) recommendedDentist = 'Isabelle Moreau';
    else if (lowerResponse.includes('jean-luc petit')) recommendedDentist = 'Jean-Luc Petit';
    
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
});