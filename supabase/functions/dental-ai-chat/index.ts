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
- Pose des questions COURTES et DIRECTES (maximum 2 phrases)
- Demande toujours plus de détails sur le problème AVANT de proposer un dentiste
- Collecte d'abord: symptômes, durée, tentatives de soulagement
- Encourage à continuer la description du problème
- Réponds en français familier

EXEMPLES DE BONNES RÉPONSES POUR COLLECTER INFO:
"Ça fait mal depuis quand exactement ?"
"Avez-vous pris des médicaments ? Lesquels ?"
"La douleur est constante ou par moments ?"
"Décrivez-moi plus précisément la douleur."

FLOW: Problème détaillé → Choix dentiste → Rendez-vous

Contexte patient: ${JSON.stringify(user_profile)}
Historique: ${conversation_history.map((msg: any) => `${msg.is_bot ? 'Bot' : 'Patient'}: ${msg.message}`).join('\n')}

Collecte d'abord toutes les infos sur le problème.`;

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

    // Simple keyword-based suggestions
    const suggestions = [];
    const lowerResponse = botResponse.toLowerCase();
    
    // Suggest problem collection for initial complaints
    if (lowerResponse.includes('problème') || lowerResponse.includes('décrivez') || 
        lowerResponse.includes('détails') || lowerResponse.includes('symptômes')) {
      suggestions.push('problem-collection');
    }
    
    // Suggest booking after problem collection
    if (lowerResponse.includes('dentiste') || lowerResponse.includes('choisissons') || 
        lowerResponse.includes('rendez-vous') || lowerResponse.includes('consultation')) {
      suggestions.push('booking');
    }
    
    // Detect urgency indicators
    const urgencyKeywords = ['urgent', 'rapidement', 'vite', 'maintenant', 'aujourd\'hui'];
    const urgency_detected = urgencyKeywords.some(keyword => lowerResponse.includes(keyword));

    return new Response(JSON.stringify({ 
      response: botResponse,
      suggestions,
      urgency_detected
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