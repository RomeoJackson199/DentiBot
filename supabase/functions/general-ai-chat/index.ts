import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

    console.log('Received general AI request:', { message, user_profile });
    
    // Validate input
    if (!message || typeof message !== 'string') {
      throw new Error('Invalid message format');
    }

    // Check if OpenAI API key is available
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.warn('OpenAI API key not found, using fallback responses');
      
      // Provide general fallback responses
      const lowerMessage = message.toLowerCase();
      let fallbackResponse = "I'm here to help you with any questions you might have. How can I assist you today?";
      
      if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('bonjour')) {
        fallbackResponse = `Hello ${user_profile?.first_name || 'there'}! How can I help you today?`;
      } else if (lowerMessage.includes('weather')) {
        fallbackResponse = "I can help you find weather information. Would you like me to search for current weather conditions?";
      } else if (lowerMessage.includes('time') || lowerMessage.includes('heure')) {
        fallbackResponse = "I can help you with time-related questions. What specific information do you need?";
      } else if (lowerMessage.includes('help') || lowerMessage.includes('aide')) {
        fallbackResponse = "I'm here to help! What would you like to know or discuss?";
      }
      
      return new Response(JSON.stringify({ 
        response: fallbackResponse,
        suggestions: [],
        is_general: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Language detection
    const detectLanguage = (text: string): string => {
      const lowercaseText = text.toLowerCase().trim();
      
      if (/bonjour|merci|français|francais/i.test(text)) return 'fr';
      if (/hallo|dank|nederlands/i.test(text)) return 'nl';
      return 'en';
    };

    const detectedLanguage = detectLanguage(message);
    console.log('Detected language:', detectedLanguage);

    // Language-specific system prompts
    const getSystemPrompt = (lang: string) => {
      switch(lang) {
        case 'fr':
          return `Vous êtes un assistant IA général et utile. Vous pouvez répondre à toutes sortes de questions et aider avec de nombreux sujets. Répondez de manière claire, utile et informative.`;
        case 'nl':
          return `Je bent een algemene en behulpzame AI-assistent. Je kunt allerlei vragen beantwoorden en helpen met vele onderwerpen. Geef duidelijke, behulpzame en informatieve antwoorden.`;
        default:
          return `You are a general and helpful AI assistant. You can answer all kinds of questions and help with many topics. Provide clear, helpful, and informative responses.`;
      }
    };

    // Prepare conversation for OpenAI
    const messages = [
      { role: 'system', content: getSystemPrompt(detectedLanguage) },
      ...conversation_history,
      { role: 'user', content: message }
    ];

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', openAIResponse.status, errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    const aiResponse = openAIData.choices[0]?.message?.content || 'I apologize, but I encountered an error processing your request.';

    return new Response(JSON.stringify({
      response: aiResponse,
      suggestions: [],
      is_general: true,
      language: detectedLanguage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in general-ai-chat function:', error);
    return new Response(JSON.stringify({
      error: 'An error occurred while processing your request.',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});