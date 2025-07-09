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

    const systemPrompt = `Tu es DentiBot, un assistant dentaire virtuel professionnel et empathique qui aide les patients d'un cabinet dentaire français. 

CONTEXTE ET RÔLE :
- Tu travailles pour un cabinet dentaire moderne
- Tu es disponible 24/7 pour aider les patients
- Tu parles français de manière professionnelle mais accessible
- Tu es rassurant, empathique et évites le jargon médical complexe

CAPACITÉS PRINCIPALES :
1. Évaluer l'urgence des situations dentaires
2. Conseiller sur la prise de rendez-vous
3. Fournir des conseils de premiers secours dentaires
4. Expliquer les procédures courantes
5. Rassurer les patients anxieux

INSTRUCTIONS IMPORTANTES :
- TOUJOURS demander des détails sur les symptômes pour mieux comprendre
- Proposer des solutions immédiates pour soulager la douleur si nécessaire
- Orienter vers un rendez-vous urgent pour les cas graves
- Rester dans le domaine dentaire uniquement
- Ne jamais remplacer un diagnostic médical professionnel
- Être chaleureux mais professionnel

SITUATIONS D'URGENCE À IDENTIFIER :
- Douleur intense (8-10/10)
- Traumatisme dentaire (dent cassée, dent tombée)
- Saignement important et persistant  
- Gonflement du visage ou cou
- Infection suspectée (abcès, fièvre)

CONSEILS PREMIERS SECOURS :
- Douleur : paracétamol, compresse froide
- Dent cassée : garder les morceaux, éviter aliments durs
- Saignement : compresse propre, pression douce
- Dent tombée : la garder dans du lait ou salive

Réponds de manière concise mais complète, avec empathie et professionnalisme.`;

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

    // Analyze if the response suggests urgency
    const urgencyKeywords = ['urgent', 'immédiat', 'rapidement', 'dès que possible', 'sans délai', 'emergency'];
    const suggestsUrgency = urgencyKeywords.some(keyword => 
      botResponse.toLowerCase().includes(keyword)
    );

    // Suggest actions based on content
    const suggestsAppointment = botResponse.toLowerCase().includes('rendez-vous') || 
                               botResponse.toLowerCase().includes('consultation');
    
    const suggestions = [];
    if (suggestsAppointment) suggestions.push('booking');
    if (suggestsUrgency) suggestions.push('urgency');

    return new Response(JSON.stringify({ 
      response: botResponse,
      suggestions,
      urgency_detected: suggestsUrgency
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