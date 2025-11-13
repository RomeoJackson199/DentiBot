import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

interface BusinessData {
  name?: string;
  tagline?: string;
  bio?: string;
  template?: string;
  phone?: string;
  email?: string;
  address?: string;
}

const getCorsHeaders = () => {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
};

const corsHeaders = getCorsHeaders();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory, currentBusinessData } = await req.json();

    // Input validation
    if (!message || typeof message !== 'string') {
      throw new Error('Invalid message format');
    }

    const sanitizedMessage = message.trim().substring(0, 2000);

    if (sanitizedMessage.length === 0) {
      throw new Error('Message cannot be empty');
    }

    // Check for Lovable API key
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not found');
      return new Response(JSON.stringify({
        response: "AI service is currently unavailable. Please try again later.",
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build system prompt for business creation assistant
    const systemPrompt = `You are an enthusiastic and helpful AI business creation assistant. Your job is to guide users through setting up their business in a friendly, conversational way.

YOUR PERSONALITY:
- Warm, encouraging, and excited to help
- Ask ONE question at a time
- Keep responses SHORT (2-3 sentences max)
- Use natural, conversational language
- Celebrate their progress with positive reinforcement
- Be genuinely interested in their business

INFORMATION YOU NEED TO COLLECT (in order):
1. Business name (required)
2. What type of business it is / business tagline (required)
3. Brief description of their business (required)
4. Contact phone number (optional)
5. Contact email (optional)
6. Business address (optional)

CONVERSATION FLOW:
- Start by asking for their business name
- Once you have the name, ask what type of business it is or what makes it special (this becomes the tagline)
- Then ask them to describe their business in a few sentences (this becomes the bio)
- After the core info (name, tagline, bio), ask if they'd like to add contact details
- If yes, collect phone, email, and address
- When you have name, tagline, and bio, you can offer to complete the setup

IMPORTANT RULES:
- Extract information from their responses and remember it
- If they mention something in passing, confirm it: "Great! So your business is called [NAME]?"
- Be flexible - they might give multiple pieces of info at once
- Don't repeat questions if they've already answered
- Make the process feel like a natural conversation, not a form
- Use their business name once you know it to make it personal
- Be encouraging: "That sounds amazing!", "I love it!", "Perfect!"

RESPONSE FORMAT:
Always respond naturally and conversationally. Your response should feel like talking to a helpful friend.

CURRENT BUSINESS DATA COLLECTED:
${JSON.stringify(currentBusinessData, null, 2)}

Based on what's been collected, guide the user to provide any missing information in a natural way.`;

    const messages: Message[] = [
      { role: 'system' as const, content: systemPrompt },
      ...(conversationHistory || []).map((msg: Message) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user' as const, content: sanitizedMessage }
    ];

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + lovableApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
        max_completion_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Lovable AI Gateway error:', errorData);
      throw new Error('AI Gateway error: ' + response.status);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Extract business data from the conversation
    const extractedData: Partial<BusinessData> = {};
    const conversationText = sanitizedMessage.toLowerCase();

    // Try to extract business name if not already set
    if (!currentBusinessData.name) {
      // Look for patterns like "it's called X", "the name is X", "my business is X"
      const namePatterns = [
        /(?:called|named|name is|business is called|it'?s called)\s+([^,.!?]+)/i,
        /^([A-Z][A-Za-z0-9\s&'-]+)(?:\s+is|\s+will be|\s+would be)/,
      ];

      for (const pattern of namePatterns) {
        const match = sanitizedMessage.match(pattern);
        if (match && match[1]) {
          extractedData.name = match[1].trim();
          break;
        }
      }

      // If they just typed a name (short response early in conversation)
      if (!extractedData.name && conversationHistory.length <= 2 && sanitizedMessage.length < 50 && !sanitizedMessage.includes(' ')) {
        extractedData.name = sanitizedMessage;
      }
    }

    // Try to extract tagline if name is set but tagline isn't
    if (currentBusinessData.name && !currentBusinessData.tagline) {
      // Look for descriptive phrases that could be taglines
      if (sanitizedMessage.length < 100 && sanitizedMessage.length > 10) {
        // If it's a reasonable length and describes what they do
        if (conversationText.includes('we ') || conversationText.includes('i ') ||
            conversationText.includes('dental') || conversationText.includes('health') ||
            conversationText.includes('service') || conversationText.includes('provide')) {
          extractedData.tagline = sanitizedMessage.trim();
        }
      }
    }

    // Try to extract bio/description if name and tagline are set
    if (currentBusinessData.name && currentBusinessData.tagline && !currentBusinessData.bio) {
      // If they're giving a longer description
      if (sanitizedMessage.length > 50) {
        extractedData.bio = sanitizedMessage.trim();
      }
    }

    // Extract contact info
    const emailMatch = sanitizedMessage.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    if (emailMatch) {
      extractedData.email = emailMatch[0];
    }

    const phoneMatch = sanitizedMessage.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b|\b\(\d{3}\)\s*\d{3}[-.]?\d{4}\b/);
    if (phoneMatch) {
      extractedData.phone = phoneMatch[0];
    }

    // Set default template
    if (currentBusinessData.name && !currentBusinessData.template) {
      extractedData.template = 'healthcare';
    }

    // Determine if we have enough information to complete
    const hasRequiredInfo =
      (currentBusinessData.name || extractedData.name) &&
      (currentBusinessData.tagline || extractedData.tagline) &&
      (currentBusinessData.bio || extractedData.bio);

    // Check if AI response indicates readiness to complete
    const responseIndicatesCompletion =
      aiResponse.toLowerCase().includes('ready to create') ||
      aiResponse.toLowerCase().includes('set up your business') ||
      aiResponse.toLowerCase().includes('all set') ||
      aiResponse.toLowerCase().includes('we have everything');

    const isComplete = hasRequiredInfo && responseIndicatesCompletion;

    return new Response(JSON.stringify({
      response: aiResponse,
      extractedData,
      isComplete,
      finalBusinessData: isComplete ? { ...currentBusinessData, ...extractedData } : null,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in ai-business-creation-assistant:', error);
    return new Response(JSON.stringify({
      error: error.message || 'An error occurred',
      response: "I'm sorry, I encountered a technical issue. Let's try that again!",
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
