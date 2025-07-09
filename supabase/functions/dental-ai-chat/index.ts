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

    const systemPrompt = `Tu es DentiBot, un assistant dentaire virtuel francophone. 

INSTRUCTIONS IMPORTANTES:
- TRÈS COURT si pas grave (1 phrase max)
- Plus de détails SEULEMENT si urgence/grave
- Demande rapidement: "Quel problème?" puis direct au dentiste
- RECOMMANDE des dentistes spécifiques selon le problème
- Réponds en français familier

RECOMMANDATIONS DENTISTES selon problème:
- Douleur/urgence → "Marie Dubois" (généraliste)
- Orthodontie/appareil → "Pierre Martin" (orthodontie) 
- Chirurgie/extraction → "Sophie Leroy" (chirurgie)
- Canal/infection → "Thomas Bernard" (endodontie)
- Gencives → "Isabelle Moreau" (parodontologie)
- Implant → "Jean-Luc Petit" (implantologie)

EXEMPLES RÉPONSES COURTES:
"Mal de dent? Dr Marie Dubois parfait pour ça."
"Appareil? Dr Pierre Martin spécialiste."
"RDV avec Dr Sophie Leroy pour extraction."

FLOW: Problème → Recommandation dentiste → Choix

Contexte patient: ${JSON.stringify(user_profile)}
Historique: ${conversation_history.map((msg: any) => `${msg.is_bot ? 'Bot' : 'Patient'}: ${msg.message}`).join('\n')}

Sois BREF et RECOMMANDE le bon dentiste.`;

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
    if (recommendedDentist || lowerResponse.includes('dentiste') || 
        lowerResponse.includes('rendez-vous') || lowerResponse.includes('rdv')) {
      suggestions.push('booking');
    }
    
    // Detect urgency indicators
    const urgencyKeywords = ['urgent', 'rapidement', 'vite', 'maintenant', 'aujourd\'hui'];
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
      error: 'Une erreur est survenue. Veuillez réessayer.',
      fallback_response: "Je suis désolé, je rencontre un problème technique. Pour une urgence dentaire, n'hésitez pas à contacter directement le cabinet ou les urgences."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});