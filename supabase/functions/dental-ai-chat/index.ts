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

    const systemPrompt = "You are DentiBot, a friendly dental virtual assistant. " +

"IMPORTANT INSTRUCTIONS: " +
"- Be conversational and engaging - have a back and forth dialogue " +
"- Ask follow-up questions to understand the patient better " +
"- Do NOT immediately recommend dentists - have at least 2-3 exchanges first " +
"- Only give medical advice if explicitly asked " +
"- Be empathetic and understanding " +
"- Ask about symptoms, when they started, severity, etc. " +
"- Build rapport before suggesting next steps " +

"DENTIST INFORMATION: " +
"Dr. Kevin Jackson - Located in downtown Toronto, specializes in general dentistry and emergency care " +
"Dr. Marie Dubois - General dentistry, pain management " +
"Dr. Pierre Martin - Orthodontics and braces " +
"Dr. Sophie Leroy - Oral surgery and extractions " +
"Dr. Thomas Bernard - Endodontics and root canals " +
"Dr. Isabelle Moreau - Periodontics and gum care " +
"Dr. Jean-Luc Petit - Implantology and dental implants " +

"CONVERSATION FLOW: " +
"1. Greet and ask how you can help " +
"2. Listen to their concern " +
"3. Ask follow-up questions (when did it start? how bad is the pain? any triggers?) " +
"4. Show empathy and understanding " +
"5. Only AFTER understanding the situation, suggest appropriate dentist " +
"6. If photo mentioned, say 'Photo received, I'll make sure the dentist sees it' " +

"EXAMPLES: " +
"'Hi! How can I help you today?' " +
"'That sounds uncomfortable. When did this pain start?' " +
"'I understand that must be really bothering you. Can you tell me more about what triggers it?' " +
"'Based on what you've described, I think Dr. [Name] would be perfect to help you with this.' " +

"Patient context: " + JSON.stringify(user_profile) + " " +
"History: " + conversation_history.map((msg: any) => (msg.is_bot ? 'Bot' : 'Patient') + ': ' + msg.message).join('\n') + " " +

"Be conversational, empathetic, and take time to understand before recommending.";

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