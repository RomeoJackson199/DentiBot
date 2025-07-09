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

    const systemPrompt = `You are DentiBot, a French-speaking dental virtual assistant. 

IMPORTANT INSTRUCTIONS:
- VERY SHORT if not serious (1 sentence max)
- More details ONLY if urgent/serious
- Ask quickly: "What problem?" then directly to dentist
- RECOMMEND specific dentists according to the problem
- If a photo is mentioned, just say "Photo received, it will be sent to the dentist"
- DO NOT analyze or describe photos
- Respond in casual English

DENTIST RECOMMENDATIONS by problem:
- Pain/emergency → "Marie Dubois" (general)
- Orthodontics/braces → "Pierre Martin" (orthodontics) 
- Surgery/extraction → "Sophie Leroy" (surgery)
- Root canal/infection → "Thomas Bernard" (endodontics)
- Gums → "Isabelle Moreau" (periodontics)
- Implant → "Jean-Luc Petit" (implantology)

EXAMPLES OF SHORT RESPONSES:
"Tooth pain? Dr Marie Dubois perfect for that."
"Braces? Dr Pierre Martin specialist."
"Photo received, Dr Sophie Leroy will see that."

FLOW: Problem → Dentist recommendation → Choice

Patient context: ${JSON.stringify(user_profile)}
History: ${conversation_history.map((msg: any) => `${msg.is_bot ? 'Bot' : 'Patient'}: ${msg.message}`).join('\n')}

Be BRIEF and RECOMMEND the right dentist.`;

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
        'Authorization': `Bearer ${openAIApiKey}`,
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
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    const botResponse = data.choices[0].message.content;

    // Simple keyword-based suggestions and recommendations
    const suggestions = [];
    const lowerResponse = botResponse.toLowerCase();
    
    // Extract dentist recommendations from response
    let recommendedDentist = null;
    if (lowerResponse.includes('marie dubois')) recommendedDentist = 'Marie Dubois';
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